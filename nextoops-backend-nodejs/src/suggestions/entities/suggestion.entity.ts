import { Exclude } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Suggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;
  @ManyToOne(() => User, (user) => user.suggestions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @Exclude()
  user: User;

  @Column()
  userId: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
