import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import sharp from 'sharp';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() recipeData: any, @Request() req) {
    return this.recipesService.create(recipeData, req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    return this.recipesService.findAll(req.user.userId);
  }

  @Get('hidden')
  getHidden(@Request() req) {
    return this.recipesService.getHidden(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recipesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() recipeData: any, @Request() req) {
    return this.recipesService.update(id, recipeData, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recipesService.remove(id, req.user.userId);
  }

  @Post(':id/fork')
  fork(@Param('id') id: string, @Request() req) {
    return this.recipesService.fork(id, req.user.userId);
  }

  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Request() req) {
    return this.recipesService.toggleFavorite(id, req.user.userId);
  }

  @Post(':id/hide')
  toggleHide(@Param('id') id: string, @Request() req) {
    return this.recipesService.toggleHide(req.user.userId, id);
  }

  @Post(':id/rate')
  rate(@Param('id') id: string, @Body('score') score: number, @Request() req) {
    return this.recipesService.rate(id, req.user.userId, score);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Seules les images sont autorisées'), false);
      }
      cb(null, true);
    },
  }))
  async uploadFile(@UploadedFile() file: any) { // Utilisation de any pour éviter les erreurs de type Multer si les types ne sont pas installés
    if (!file) {
      throw new BadRequestException('Aucun fichier envoyé');
    }

    const uploadDir = './uploads/recipes';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `recipe-${Date.now()}.webp`;
    const filePath = join(uploadDir, fileName);

    try {
      // Redimensionnement automatique à 800px max et conversion en WebP
      await sharp(file.path)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat('webp')
        .toFile(filePath);

      // Supprimer le fichier temporaire
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }

      return {
        url: `/uploads/recipes/${fileName}`
      };
    } catch (error) {
      console.error('Erreur traitement image:', error);
      throw new BadRequestException('Erreur lors du traitement de l\'image');
    }
  }
}
