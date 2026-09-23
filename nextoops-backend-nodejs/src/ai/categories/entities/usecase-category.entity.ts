import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UseCase } from '../use-cases/entities/use-case.entity';

@Entity()
export class UseCaseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UseCase, (useCase) => useCase.useCaseCategory)
  useCases: UseCase[];

  @Column({ default: false })
  isSandbox: boolean;
}
