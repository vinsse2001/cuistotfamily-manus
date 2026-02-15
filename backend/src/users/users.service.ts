import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAlias } from './entities/user-alias.entity';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserAlias)
    private userAliasRepository: Repository<UserAlias>,
    private jwtService: JwtService,
  ) {}

  private validatePassword(password: string) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      this.validatePassword(userData.password);
    }
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async findOneById(id: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user || undefined;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ 
      select: ['id', 'email', 'nickname', 'role', 'isActive', 'isEmailVerified', 'photoUrl', 'createdAt'],
      order: { createdAt: 'DESC' } 
    });
  }

  async update(id: string, updateData: any): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateData.email, id: Not(id) } 
      });
      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé par un autre compte');
      }
    }

    if (updateData.password) {
      this.validatePassword(updateData.password);
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    user.isActive = !user.isActive;
    
    if (user.isActive && !user.isEmailVerified) {
      user.isEmailVerified = true;
      (user as any).verificationCode = null;
    }
    
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('Le rôle doit être "user" ou "admin"');
    }
    
    user.role = role;
    return this.usersRepository.save(user);
  }

  async forgotPassword(email: string) {
    const user = await this.findOneByEmail(email);
    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure
    await this.usersRepository.save(user);

    console.log(`[EMAIL SIMULATION] Lien de réinitialisation pour ${user.email} : http://localhost:4200/reset-password?token=${token}`);
    
    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.usersRepository.findOne({
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date())
      }
    });

    if (!user) {
      console.log("[PASSWORD RESET ERROR] Jeton invalide ou expiré.");
      throw new BadRequestException("Le jeton de réinitialisation est invalide ou a expiré.");
    }

    console.log(`[PASSWORD RESET] Tentative de réinitialisation pour l'utilisateur ${user.email}`);
    console.log(`[PASSWORD RESET] Nouveau mot de passe reçu (non haché): ${newPass ? '*****' : 'vide'}`);

    this.validatePassword(newPass);
    const hashedPassword = await bcrypt.hash(newPass, 10);
    console.log(`[PASSWORD RESET] Nouveau mot de passe haché: ${hashedPassword ? '*****' : 'vide'}`);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpires = undefined as any;
    
    try {
      await this.usersRepository.save(user);
      console.log(`[PASSWORD RESET SUCCESS] Mot de passe de l'utilisateur ${user.email} réinitialisé et sauvegardé avec succès.`);
    } catch (error) {
      console.error(`[PASSWORD RESET ERROR] Erreur lors de la sauvegarde du mot de passe pour ${user.email}:`, error);
      throw new BadRequestException("Erreur lors de la sauvegarde du nouveau mot de passe.");
    }

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  async generateJwtToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async deletePhoto(userId: string): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException("Utilisateur non trouvé");
    }

    if (user.photoUrl) {
      const filePath = path.join(__dirname, '../../..', user.photoUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Impossible de supprimer le fichier ${filePath}:`, error);
      }
    }

    user.photoUrl = null;
    return this.usersRepository.save(user);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte administrateur.');
    }
    await this.usersRepository.delete(id);
  }

  async setAlias(ownerId: string, targetUserId: string, alias: string) {
    let userAlias = await this.userAliasRepository.findOne({ where: { ownerId, targetUserId } });
    if (userAlias) {
      userAlias.alias = alias;
    } else {
      userAlias = this.userAliasRepository.create({ ownerId, targetUserId, alias });
    }
    return this.userAliasRepository.save(userAlias);
  }

  async getAliases(ownerId: string) {
    return this.userAliasRepository.find({ where: { ownerId } });
  }
}
