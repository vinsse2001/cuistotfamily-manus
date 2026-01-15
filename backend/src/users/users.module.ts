import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserAlias } from './entities/user-alias.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAlias])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
