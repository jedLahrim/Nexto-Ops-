import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity()
export class PostRelatedPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  orderIndex: number;

  @ManyToOne(() => Post, (post) => post.postRelatedPosts, {
    onDelete: 'CASCADE',
  })
  post: Post;

  @Column()
  postId: string;

  @ManyToOne(() => Post, (post) => post.linkedRelatedPosts, {
    onDelete: 'CASCADE',
  })
  related: Post;

  @Column()
  relatedId: string;
}
