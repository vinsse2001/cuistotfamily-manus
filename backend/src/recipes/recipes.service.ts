import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { Favorite } from './entities/favorite.entity';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async create(recipeData: Partial<Recipe>, userId: string): Promise<Recipe> {
    const recipe = this.recipesRepository.create({
      ...recipeData,
      ownerId: userId,
    });
    return this.recipesRepository.save(recipe);
  }

  async findAll(userId: string): Promise<Recipe[]> {
    return this.recipesRepository.find({
      where: [
        { ownerId: userId },
        { visibility: 'public' }
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipesRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    return recipe;
  }

  async update(id: string, recipeData: Partial<Recipe>, userId: string): Promise<Recipe> {
    const recipe = await this.findOne(id);
    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }
    Object.assign(recipe, recipeData);
    return this.recipesRepository.save(recipe);
  }

  async remove(id: string, userId: string): Promise<void> {
    const recipe = await this.findOne(id);
    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }
    await this.recipesRepository.remove(recipe);
  }

  async fork(id: string, userId: string): Promise<Recipe> {
    const original = await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, createdAt: __, ownerId: ___, ...rest } = original;
    const forkedRecipe = this.recipesRepository.create({
      ...rest,
      ownerId: userId,
      forkedFromId: original.id,
      visibility: 'private'
    });
    return this.recipesRepository.save(forkedRecipe);
  }

  async toggleFavorite(recipeId: string, userId: string) {
    const favorite = await this.favoritesRepository.findOne({ where: { recipeId, userId } });
    if (favorite) {
      await this.favoritesRepository.remove(favorite);
      return { isFavorite: false };
    } else {
      const newFavorite = this.favoritesRepository.create({ recipeId, userId });
      await this.favoritesRepository.save(newFavorite);
      return { isFavorite: true };
    }
  }

  async rate(recipeId: string, userId: string, score: number) {
    let rating = await this.ratingsRepository.findOne({ where: { recipeId, userId } });
    if (rating) {
      rating.score = score;
    } else {
      rating = this.ratingsRepository.create({ recipeId, userId, score });
    }
    return this.ratingsRepository.save(rating);
  }
}
