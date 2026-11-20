import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { InstructorProfile } from '../../instructor/entities/instructor-profile.entity';

export enum UserRole {
  LEARNER = 'LEARNER',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash?: string;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({
    type: 'varchar',
    array: true,
    default: () => "ARRAY['LEARNER']::varchar[]",
  })
  roles: UserRole[];

  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @OneToOne(() => InstructorProfile, (profile) => profile.user, {
    nullable: true,
  })
  instructorProfile?: InstructorProfile;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
