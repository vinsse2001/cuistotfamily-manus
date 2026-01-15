import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Recipe } from './recipe.entity';

@Entity('favorites')
@Unique(['userId', 'recipeId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @Column()
  recipeId: string;
}
