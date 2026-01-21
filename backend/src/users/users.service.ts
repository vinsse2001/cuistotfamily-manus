import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAlias } from './entities/user-alias.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserAlias)
    private userAliasRepository: Repository<UserAlias>,
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
      select: ['id', 'email', 'nickname', 'role', 'isActive', 'isEmailVerified', 'createdAt'],
      order: { createdAt: 'DESC' } 
    });
  }

  async updateProfile(id: string, updateData: any): Promise<User> {
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
