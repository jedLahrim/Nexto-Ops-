import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { Tutorial } from './tutorial.entity';

@Entity()
export class UserTutorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ default: false })
  viewed: boolean;
  @ManyToOne(() => Tutorial, (tutorial) => tutorial.userTutorials, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @Exclude()
  tutorial: Tutorial;
  @ManyToOne(() => User, (user) => user.userTutorials, {
    onDelete: 'CASCADE',
  })
  @Exclude()
  user: User;
  @Column()
  userId: string;

  @Expose({ name: 'name' })
  get name() {
    return this.tutorial?.name;
  }

  @Expose({ name: 'videoUrl' })
  get videoUrl() {
    return this.tutorial?.videoUrl;
  }
}
