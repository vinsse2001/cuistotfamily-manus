import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
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
}
