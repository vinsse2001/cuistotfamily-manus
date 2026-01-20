import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException, NotFoundException, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async findAll(@Request() req) {
    const role = req.user?.role;
    if (role !== 'admin') {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/status/:id')
  async toggleStatus(@Request() req, @Param('id') id: string) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Action non autorisée');
    }
    
    // Sécurité : Empêcher de se désactiver soi-même
    if (req.user.userId === id) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte administrateur');
    }

    return this.usersService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Action non autorisée');
    }

    // Sécurité : Empêcher de se supprimer soi-même
    // Note: UsersService.remove vérifie aussi cela, mais on le fait ici pour la cohérence
    return this.usersService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('aliases')
  async getAliases(@Request() req) {
    return this.usersService.getAliases(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alias')
  async setAlias(@Request() req, @Body() data: { targetUserId: string, alias: string }) {
    return this.usersService.setAlias(req.user.userId, data.targetUserId, data.alias);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }
}
