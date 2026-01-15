import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Recipe } from './recipe.entity';

@Entity('ratings')
@Unique(['userId', 'recipeId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  score: number; // 1 à 5

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
