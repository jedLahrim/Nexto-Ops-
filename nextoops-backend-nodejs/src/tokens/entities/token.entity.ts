import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  value: string;

  @Column()
  expiredAt: Date;

  @Column({ nullable: true })
  maxConsuming?: number;

  @Column({ default: 0 })
  consumedTimes: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  get consumed(): boolean {
    // if maxConsuming null so return will be false, mean this token could be consumed infinity
    return this.maxConsuming && this.consumedTimes >= this.maxConsuming;
  }
}
