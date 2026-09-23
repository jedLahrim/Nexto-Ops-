import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { Post } from './post.entity';

@Entity()
export class TagPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tag, (object) => object.tagPosts, {
    onDelete: 'CASCADE',
  })
  tag: Tag;

  @Column()
  tagId: string;

  @ManyToOne(() => Post, (object) => object.tagPosts, {
    onDelete: 'CASCADE',
  })
  post: Post;

  @Column()
  postId: string;
}
