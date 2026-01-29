import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('request')
  sendFriendRequest(@Request() req, @Body('nickname') nickname: string) {
    return this.socialService.sendFriendRequest(req.user.userId, nickname);
  }

  @Post('accept/:id')
  acceptFriendRequest(@Request() req, @Param('id') requestId: string) {
    return this.socialService.acceptFriendRequest(req.user.userId, requestId);
  }

  @Post('decline/:id')
  declineFriendRequest(@Request() req, @Param('id') requestId: string) {
    return this.socialService.declineFriendRequest(req.user.userId, requestId);
  }

  @Get('friends')
  getFriends(@Request() req) {
    return this.socialService.getFriends(req.user.userId);
  }

  @Get('requests/pending')
  getPendingRequests(@Request() req) {
    return this.socialService.getPendingRequests(req.user.userId);
  }

  @Delete('friends/:id')
  removeFriend(@Request() req, @Param('id') friendId: string) {
    return this.socialService.removeFriend(req.user.userId, friendId);
  }

  @Get('search')
  searchUsers(@Request() req, @Query('q') query: string) {
    return this.socialService.searchUsers(query, req.user.userId);
  }
}
