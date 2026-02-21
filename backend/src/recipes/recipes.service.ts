import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { Favorite } from './entities/favorite.entity';
import { Rating } from './entities/rating.entity';
import { UserHiddenRecipe } from './entities/user-hidden-recipe.entity';
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
    @InjectRepository(UserHiddenRecipe)
    private hiddenRepository: Repository<UserHiddenRecipe>,
    private socialService: SocialService,
  ) {}

  async create(recipeData: Partial<Recipe>, userId: string): Promise<Recipe> {
    const recipe = this.recipesRepository.create({
      ...recipeData,
      ownerId: userId,
    });
    const savedRecipe = await this.recipesRepository.save(recipe);
    
    if (savedRecipe.visibility === 'friends') {
      const friends = await this.socialService.getFriends(userId);
      friends.forEach(friend => {
        console.log(`[NOTIFICATION] Nouvelle recette pour ${friend.nickname}`);
      });
    }
    
    return savedRecipe;
  }

  async findAll(userId: string): Promise<any[]> {
    // Récupérer les IDs des amis
    const friends = await this.socialService.getFriends(userId);
    const friendIds = friends.map(f => f.id);

    // Récupérer les IDs des recettes masquées par l'utilisateur
    const hiddenRecipes = await this.hiddenRepository.find({ where: { userId } });
    const hiddenIds = hiddenRecipes.map(h => h.recipeId);

    const whereConditions: any[] = [
      { ownerId: userId },
      { visibility: 'public' }
    ];

    if (friendIds.length > 0) {
      whereConditions.push({ visibility: 'friends', ownerId: In(friendIds) });
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

    const hiddenSet = new Set(hiddenIds);

    return recipes.map(recipe => {
      const recipeRatings = allRatings.filter(r => r.recipeId === recipe.id);
      const averageRating = recipeRatings.length > 0 
        ? recipeRatings.reduce((sum, r) => sum + r.score, 0) / recipeRatings.length 
        : 0;

      return {
        ...recipe,
        isFavorite: favoriteSet.has(recipe.id),
        isHidden: hiddenSet.has(recipe.id),
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
    let isHidden = false;
    let userRating = 0;

    if (userId) {
      const favorite = await this.favoritesRepository.findOne({ where: { recipeId: id, userId } });
      isFavorite = !!favorite;

      const hidden = await this.hiddenRepository.findOne({ where: { recipeId: id, userId } });
      isHidden = !!hidden;

      const rating = await this.ratingsRepository.findOne({ where: { recipeId: id, userId } });
      userRating = rating ? rating.score : 0;
    }

    return {
      ...recipe,
      isFavorite,
      isHidden,
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

    // Si on ne met à jour QUE les infos nutritionnelles, on autorise tous ceux qui ont accès à la recette
    const nutritionalKeys = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "vitamins", "minerals"];
    const isOnlyNutrition = Object.keys(recipeData).every(key => nutritionalKeys.includes(key));

    if (!isOnlyNutrition && recipe.ownerId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres recettes');
    }

    // Si ce n'est pas le propriétaire, on vérifie quand même qu'il a le droit de voir la recette
    if (recipe.ownerId !== userId) {
      await this.findOne(id, userId); // Lance une ForbiddenException si pas d'accès
    }

    // Si on met à jour les données nutritionnelles, on les remplace complètement pour éviter les fusions partielles.
    if (isOnlyNutrition) {
      recipe.nutritionalInfo = {
        ...recipe.nutritionalInfo,
        calories: recipeData.nutritionalInfo?.calories,
        protein: recipeData.nutritionalInfo?.protein,
        carbs: recipeData.nutritionalInfo?.carbs,
        fat: recipeData.nutritionalInfo?.fat,
        fiber: recipeData.nutritionalInfo?.fiber,
        sugar: recipeData.nutritionalInfo?.sugar,
        sodium: recipeData.nutritionalInfo?.sodium,
        vitamins: recipeData.nutritionalInfo?.vitamins,
        minerals: recipeData.nutritionalInfo?.minerals,
      };
    } else {
      Object.assign(recipe, recipeData);
    }
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
    const hidden = await this.hiddenRepository.findOne({
      where: { userId, recipeId }
    });

    if (hidden) {
      await this.hiddenRepository.remove(hidden);
      return { isHidden: false };
    } else {
      const newHidden = this.hiddenRepository.create({ userId, recipeId });
      await this.hiddenRepository.save(newHidden);
      return { isHidden: true };
    }
  }

  async getHidden(userId: string) {
    const hiddenEntries = await this.hiddenRepository.find({
      where: { userId },
      relations: ['recipe']
    });
    
    const recipes = hiddenEntries.map(h => h.recipe);
    
    // On doit aussi ajouter les infos de favoris/notes pour ces recettes
    if (recipes.length === 0) return [];
    
    const recipeIds = recipes.map(r => r.id);
    const userFavorites = await this.favoritesRepository.find({
      where: { userId, recipeId: In(recipeIds) }
    });
    const favoriteSet = new Set(userFavorites.map(f => f.recipeId));

    return recipes.map(recipe => ({
      ...recipe,
      isFavorite: favoriteSet.has(recipe.id),
      isHidden: true
    }));
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
