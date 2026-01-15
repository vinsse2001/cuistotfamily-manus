import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
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

  @Post(':id/rate')
  rate(@Param('id') id: string, @Body('score') score: number, @Request() req) {
    return this.recipesService.rate(id, req.user.userId, score);
  }
}
