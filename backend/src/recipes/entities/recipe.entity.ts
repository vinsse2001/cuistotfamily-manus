import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('recipe')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ type: 'jsonb' })
  ingredients: any[];

  @Column({ type: 'text', array: true })
  instructions: string[];

  @Column({ type: 'jsonb', nullable: true })
  nutritionalInfo: any;

  @Column({ default: 'private' })
  visibility: 'private' | 'friends' | 'public';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @ManyToOne(() => Recipe, { nullable: true })
  @JoinColumn({ name: 'forkedFromId' })
  forkedFrom: Recipe;

  @Column({ nullable: true })
  forkedFromId: string;

  @CreateDateColumn()
  createdAt: Date;
}
