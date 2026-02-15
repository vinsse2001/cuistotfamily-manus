import { Controller, Get, Patch, Body, UseGuards, Request, ForbiddenException, Post, UseInterceptors, UploadedFile, BadRequestException, Param, NotFoundException, Delete } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
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
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new BadRequestException('Seules les images (jpg, jpeg, png, gif, webp) sont autorisées.'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    }
  }))
  async uploadPhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {

    if (!file) {
      throw new BadRequestException("Aucun fichier téléchargé");
    }
    const filename = `${path.parse(file.filename).name}.jpeg`;
    const outputPath = path.join(file.destination, filename);

    try {
      await sharp(file.path)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // Supprimer le fichier original uploadé par Multer
      await fs.unlink(file.path);

      const photoUrl = `/uploads/profiles/${filename}`;
      const user = await this.usersService.findOneById(req.user.id);
      if (user && user.photoUrl) {
        const oldFilePath = path.join(__dirname, '../../..', user.photoUrl);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.warn(`Impossible de supprimer l'ancien fichier ${oldFilePath}:`, error);
        }
      }
      await this.usersService.update(req.user.id, { photoUrl });
      const updatedUser = await this.usersService.findOneById(req.user.id);
      if (!updatedUser) {
        throw new NotFoundException("Utilisateur non trouvé après la mise à jour de la photo.");
      }
      const payload = { sub: updatedUser.id, email: updatedUser.email, role: updatedUser.role, nickname: updatedUser.nickname, photoUrl: updatedUser.photoUrl };
      const access_token = await this.usersService.generateJwtToken(payload);
      return { photoUrl, access_token };
    } catch (error) {
      // Supprimer le fichier original si Sharp échoue
      await fs.unlink(file.path).catch(() => {}); // Ignorer les erreurs si le fichier n'existe pas
      throw new BadRequestException('Erreur lors du traitement de l\'image.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile/photo')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Request() req) {
    await this.usersService.deletePhoto(req.user.id);
    const updatedUser = await this.usersService.findOneById(req.user.id);
    if (!updatedUser) {
      throw new NotFoundException("Utilisateur non trouvé après la suppression de la photo.");
    }
    const payload = { sub: updatedUser.id, email: updatedUser.email, role: updatedUser.role, nickname: updatedUser.nickname, photoUrl: updatedUser.photoUrl };
    const access_token = await this.usersService.generateJwtToken(payload);
    return { message: 'Photo de profil supprimée avec succès', photoUrl: null, access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/role/:id')
  async updateUserRole(@Request() req, @Param('id') id: string, @Body('role') role: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }
    return this.usersService.updateRole(id, role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/status/:id')
  async toggleUserStatus(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }
    return this.usersService.toggleStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }
    return this.usersService.remove(id, req.user.id);
  }

  @Get(":id")
  async findOne(@Request() req, @Param("id") id: string) {
    // L'utilisateur ne peut voir que son propre profil ou si c'est un admin

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
