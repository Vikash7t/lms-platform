import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum InstructorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('instructor_profiles')
export class InstructorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_instructor_profiles_user_id', { unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.instructorProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  headline: string;

  @Column({ type: 'text' })
  bio: string;

  @Column({ nullable: true, length: 255 })
  websiteUrl?: string;

  @Column({ nullable: true, length: 255 })
  twitterUrl?: string;

  @Column({ nullable: true, length: 255 })
  linkedinUrl?: string;

  @Column({ nullable: true, length: 255 })
  githubUrl?: string;

  @Index('idx_instructor_profiles_status')
  @Column({
    type: 'enum',
    enum: InstructorStatus,
    default: InstructorStatus.PENDING,
  })
  status: InstructorStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
