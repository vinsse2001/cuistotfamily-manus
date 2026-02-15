import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
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

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl: string | null;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date;

  @CreateDateColumn()
  createdAt: Date;
}
