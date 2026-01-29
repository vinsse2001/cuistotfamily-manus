import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship]),
    UsersModule
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService]
})
export class SocialModule {}
