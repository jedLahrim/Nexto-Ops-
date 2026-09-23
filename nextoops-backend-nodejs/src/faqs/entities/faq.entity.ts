import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserType } from '../../user/enums/user-type.enum';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';
import { SubjectType } from '../../posts/enum/subject-type';

@Entity()
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  question: string;
  @Column({ type: 'text' })
  answer: string;

  @Column({ default: SubjectType.WELLNESS })
  subjectType: SubjectType;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userType: UserType;

  @ManyToOne(() => User, (user) => user.faqs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @Exclude()
  user: User;

  @Column()
  userId: string;
}
