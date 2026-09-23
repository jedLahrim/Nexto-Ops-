import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserType } from '../enums/user-type.enum';

@Entity()
export class VerificationCode extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  code: string;
  @Column()
  email: string;
  @Column()
  userType: UserType;
  @Column()
  expireAt: Date;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ nullable: true, default: 1 })
  maxConsuming?: number;
  @Column({ default: 0 })
  consumedTimes: number;

  get consumed(): boolean {
    return this.maxConsuming && this.consumedTimes >= this.maxConsuming;
  }
}
