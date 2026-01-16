import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async findAll(@Request() req) {
    // Le payload JWT peut utiliser 'sub' ou 'userId' selon la version, on vérifie les deux
    const role = req.user.role;
    if (role !== 'admin') throw new ForbiddenException('Accès refusé');
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    const userId = req.user.sub || req.user.userId;
    return this.usersService.updateProfile(userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/status/:id')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    const role = req.user.role;
    if (role !== 'admin') throw new ForbiddenException('Accès refusé');
    return this.usersService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  async remove(@Param('id') id: string, @Request() req) {
    const role = req.user.role;
    if (role !== 'admin') throw new ForbiddenException('Accès refusé');
    const userId = req.user.sub || req.user.userId;
    return this.usersService.remove(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alias')
  async setAlias(@Request() req, @Body() body: { targetUserId: string; alias: string }) {
    const userId = req.user.sub || req.user.userId;
    return this.usersService.setAlias(userId, body.targetUserId, body.alias);
  }

  @UseGuards(JwtAuthGuard)
  @Get('aliases')
  async getAliases(@Request() req) {
    const userId = req.user.sub || req.user.userId;
    return this.usersService.getAliases(userId);
  }
}
