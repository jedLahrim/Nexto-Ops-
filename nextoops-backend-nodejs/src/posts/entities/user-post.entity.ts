import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';
import { User } from '../../user/entities/user.entity';
import { Expose } from 'class-transformer';

@Entity()
export class UserPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  liked: boolean;

  @Column({ default: false })
  disliked: boolean;

  @Column({ default: 0 })
  views: number;
  @ManyToOne(() => User, (user) => user.userPosts, {
    onDelete: 'CASCADE',
  })
  user: User;
  @Column()
  userId: string;
  @ManyToOne(() => Post, (post) => post.userPosts, {
    onDelete: 'CASCADE',
  })
  post: Post;
  @Column()
  postId: string;

  @Expose({ name: 'viewed' })
  get viewed(): boolean {
    return this.views > 0;
  }
}
