import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Recipe } from './recipe.entity';

@Entity('user_hidden_recipes')
export class UserHiddenRecipe {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  recipeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @CreateDateColumn()
  createdAt: Date;
}
