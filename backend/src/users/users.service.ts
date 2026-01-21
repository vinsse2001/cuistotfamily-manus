import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(userData: Partial<User>): Promise<User> {
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

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    user.isActive = !user.isActive;
    
    // Si l'admin active le compte manuellement, on considère l'email comme vérifié
    if (user.isActive && !user.isEmailVerified) {
      user.isEmailVerified = true;
      user.verificationCode = null;
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
