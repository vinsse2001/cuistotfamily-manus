import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async findAll(@Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès refusé');
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/status/:id')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès refusé');
    return this.usersService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès refusé');
    return this.usersService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alias')
  async setAlias(@Request() req, @Body() body: { targetUserId: string; alias: string }) {
    return this.usersService.setAlias(req.user.userId, body.targetUserId, body.alias);
  }

  @UseGuards(JwtAuthGuard)
  @Get('aliases')
  async getAliases(@Request() req) {
    return this.usersService.getAliases(req.user.userId);
  }
}
