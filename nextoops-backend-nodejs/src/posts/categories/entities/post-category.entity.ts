import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Category } from './category.entity';

@Entity()
export class PostCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.postCategories, {
    onDelete: 'CASCADE',
  })
  post: Post;

  @Column()
  postId: string;

  @ManyToOne(() => Category, (category) => category.postCategories, {
    onDelete: 'CASCADE',
  })
  category: Category;

  @Column()
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
