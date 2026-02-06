import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('usage_logs')
export class UsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.usageLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column()
  tokensUsed: number;

  @Column()
  endpoint: string; // '/translate/text' | '/translate/batch' | '/translate/image'

  @Column({ nullable: true })
  sourceLang: string;

  @Column({ nullable: true })
  targetLang: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
