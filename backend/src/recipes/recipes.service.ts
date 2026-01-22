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

  async findOne(id: string): Promise<any> {
    const recipe = await this.recipesRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    // Récupérer les notes moyennes et le nombre de votes
    const ratings = await this.ratingsRepository.find({ where: { recipeId: id } });
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length 
      : 0;

    return {
      ...recipe,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount: ratings.length
    };
  }

  async update(id: string, recipeData: Partial<Recipe>, userId: string): Promise<Recipe> {
    const recipe = await this.recipesRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }
    Object.assign(recipe, recipeData);
    return this.recipesRepository.save(recipe);
  }

  async remove(id: string, userId: string): Promise<void> {
    const recipe = await this.recipesRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }
    await this.recipesRepository.remove(recipe);
  }

  async fork(id: string, userId: string): Promise<Recipe> {
    const original = await this.recipesRepository.findOne({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
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
    // Valider le score
    if (score < 1 || score > 5) {
      throw new Error('Score must be between 1 and 5');
    }

    let rating = await this.ratingsRepository.findOne({ where: { recipeId, userId } });
    if (rating) {
      rating.score = score;
    } else {
      rating = this.ratingsRepository.create({ recipeId, userId, score });
    }
    await this.ratingsRepository.save(rating);

    // Retourner la note moyenne mise à jour
    const allRatings = await this.ratingsRepository.find({ where: { recipeId } });
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length 
      : 0;

    return {
      userRating: score,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount: allRatings.length
    };
  }
}
