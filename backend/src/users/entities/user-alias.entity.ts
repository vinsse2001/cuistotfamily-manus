import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('user_aliases')
@Unique(['ownerId', 'targetUserId'])
export class UserAlias {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column()
  targetUserId: string;

  @Column()
  alias: string;
}
