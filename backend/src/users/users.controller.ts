import { Controller, Get, Delete, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'admin') throw new Error('Accès refusé');
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new Error('Accès refusé');
    return this.usersService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new Error('Accès refusé');
    return this.usersService.remove(id, req.user.userId);
  }
}
