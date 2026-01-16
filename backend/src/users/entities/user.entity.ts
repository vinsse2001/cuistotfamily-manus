import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nickname: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string; // 'user' or 'admin'

  @CreateDateColumn()
  createdAt: Date;
}
