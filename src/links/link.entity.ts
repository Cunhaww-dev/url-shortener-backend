import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Link {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string;
  @Column() url: string;
  @Column({ default: 0 }) clicks: number;
  @CreateDateColumn() createdAt: Date;
}
