import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AiService } from './ai.service';
import { RecipesService } from '../recipes/recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly recipesService: RecipesService,
  ) {}

  @Post('analyze/:recipeId')
  async analyze(@Param('recipeId') recipeId: string) {
    const recipe = await this.recipesService.findOne(recipeId);
    const analysis = await this.aiService.analyzeRecipe(recipe);
    
    // Sauvegarder l'analyse dans la recette pour éviter les appels futurs
    await this.recipesService.update(recipeId, { nutritionalInfo: analysis }, recipe.ownerId);
    
    return analysis;
  }

  @Post('lia')
  async askLia(@Body('question') question: string) {
    return this.aiService.askLia(question);
  }
}
