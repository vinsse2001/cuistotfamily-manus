import { Controller, Get, Patch, Body, UseGuards, Request, ForbiddenException, Post, UseInterceptors, UploadedFile, BadRequestException, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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
    return this.usersService.update(req.user.id, updateData);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: any) {
    return this.usersService.resetPassword(data.token, data.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/profiles',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new BadRequestException('Seules les images sont autorisées'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    }
  }))
  async uploadPhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
    console.log("Upload Photo: Received file", file);
    if (!file) {
      throw new BadRequestException("Aucun fichier téléchargé");
    }
    const photoUrl = `/uploads/profiles/${file.filename}`;
    await this.usersService.update(req.user.id, { photoUrl });
    const updatedUser = await this.usersService.findOneById(req.user.id);
    if (!updatedUser) {
      throw new NotFoundException("Utilisateur non trouvé après la mise à jour de la photo.");
    }
    const payload = { sub: updatedUser.id, email: updatedUser.email, role: updatedUser.role, nickname: updatedUser.nickname, photoUrl: updatedUser.photoUrl };
    const access_token = await this.usersService.generateJwtToken(payload);
    return { photoUrl, access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Request() req, @Param("id") id: string) {
    // L'utilisateur ne peut voir que son propre profil ou si c'est un admin
    console.log(`[UsersController] findOne: req.user.id=${req.user.id}, param.id=${id}, req.user.role=${req.user.role}`);
    if (req.user.id !== id && req.user.role !== "admin") {
      throw new ForbiddenException("Vous n'êtes pas autorisé à voir ce profil");
    }
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException("Utilisateur non trouvé");
    }
    // Ne pas retourner le mot de passe ou d'autres informations sensibles
    const { password, resetPasswordToken, resetPasswordExpires, ...result } = user;
    return result;
  }
}
