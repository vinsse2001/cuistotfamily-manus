import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { Favorite } from './entities/favorite.entity';
import { Rating } from './entities/rating.entity';
import { SocialService } from '../social/social.service';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
    private socialService: SocialService,
  ) {}

  async create(recipeData: Partial<Recipe>, userId: string): Promise<Recipe> {
    const recipe = this.recipesRepository.create({
      ...recipeData,
      ownerId: userId,
    });
    return this.recipesRepository.save(recipe);
  }

  async findAll(userId: string): Promise<any[]> {
    // Récupérer les IDs des amis
    const friends = await this.socialService.getFriends(userId);
    const friendIds = friends.map(f => f.id);

    const whereConditions: any[] = [
      { ownerId: userId, isHidden: false },
      { visibility: 'public', isHidden: false }
    ];

    if (friendIds.length > 0) {
      whereConditions.push({ visibility: 'friends', ownerId: In(friendIds), isHidden: false });
    }

    const recipes = await this.recipesRepository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' }
    });

    if (recipes.length === 0) return [];

    const recipeIds = recipes.map(r => r.id);

    // Récupérer tous les favoris de l'utilisateur pour ces recettes
    const userFavorites = await this.favoritesRepository.find({
      where: { userId, recipeId: In(recipeIds) }
    });
    const favoriteSet = new Set(userFavorites.map(f => f.recipeId));

    // Récupérer toutes les notes de l'utilisateur pour ces recettes
    const userRatings = await this.ratingsRepository.find({
      where: { userId, recipeId: In(recipeIds) }
    });
    const ratingMap = new Map(userRatings.map(r => [r.recipeId, r.score]));

    // Récupérer toutes les notes moyennes
    const allRatings = await this.ratingsRepository.find({
      where: { recipeId: In(recipeIds) }
    });

    return recipes.map(recipe => {
      const recipeRatings = allRatings.filter(r => r.recipeId === recipe.id);
      const averageRating = recipeRatings.length > 0 
        ? recipeRatings.reduce((sum, r) => sum + r.score, 0) / recipeRatings.length 
        : 0;

      return {
        ...recipe,
        isFavorite: favoriteSet.has(recipe.id),
        userRating: ratingMap.get(recipe.id) || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount: recipeRatings.length
      };
    });
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const recipe = await this.recipesRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    // Vérifier la visibilité
    if (recipe.ownerId !== userId && recipe.visibility !== 'public') {
      if (recipe.visibility === 'friends') {
        const isFriend = userId ? await this.socialService.isFriend(userId, recipe.ownerId) : false;
        if (!isFriend) {
          throw new ForbiddenException('Cette recette est réservée aux amis de l\'auteur');
        }
      } else {
        throw new ForbiddenException('Cette recette est privée');
      }
    }

    // Récupérer les notes moyennes et le nombre de votes
    const ratings = await this.ratingsRepository.find({ where: { recipeId: id } });
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length 
      : 0;

    let isFavorite = false;
    let userRating = 0;

    if (userId) {
      const favorite = await this.favoritesRepository.findOne({ where: { recipeId: id, userId } });
      isFavorite = !!favorite;

      const rating = await this.ratingsRepository.findOne({ where: { recipeId: id, userId } });
      userRating = rating ? rating.score : 0;
    }

    return {
      ...recipe,
      isFavorite,
      userRating,
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
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, recipeId }
    });

    if (favorite) {
      await this.favoritesRepository.remove(favorite);
      return { isFavorite: false };
    } else {
      const newFavorite = this.favoritesRepository.create({ userId, recipeId });
      await this.favoritesRepository.save(newFavorite);
      return { isFavorite: true };
    }
  }

  async toggleHide(userId: string, recipeId: string) {
    const recipe = await this.recipesRepository.findOne({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException('Recette non trouvée');
    
    recipe.isHidden = !recipe.isHidden;
    await this.recipesRepository.save(recipe);
    return { isHidden: recipe.isHidden };
  }

  async getHidden(userId: string) {
    return this.recipesRepository.find({
      where: { ownerId: userId, isHidden: true },
      order: { createdAt: 'DESC' }
    });
  }

  async rate(recipeId: string, userId: string, score: number) {
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
