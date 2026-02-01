import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe } from './entities/recipe.entity';
import { Favorite } from './entities/favorite.entity';
import { Rating } from './entities/rating.entity';
import { UserHiddenRecipe } from './entities/user-hidden-recipe.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, Favorite, Rating, UserHiddenRecipe]),
    SocialModule
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
