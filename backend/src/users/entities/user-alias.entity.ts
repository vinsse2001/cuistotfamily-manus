import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('user_aliases') // Renommé aussi pour cohérence
@Unique(['ownerId', 'targetUserId'])
export class UserAlias {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column()
  targetUserId: string;

  @Column()
  alias: string;
}
