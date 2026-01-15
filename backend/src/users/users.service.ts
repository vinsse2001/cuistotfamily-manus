import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAlias } from './entities/user-alias.entity';

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
