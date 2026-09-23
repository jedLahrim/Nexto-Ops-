import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PostContentType, PostType } from '../enum/post-type.enum';
import { Tag } from '../tags/entities/tag.entity';
import { Exclude, Expose } from 'class-transformer';
import { UserPost } from './user-post.entity';
import { TagPost } from './tag-post.entity';
import { AppRoutes } from '../../commons/app.routes';
import { PostRelatedPost } from './related-post.entity';
import { PostTranslation } from './post-translation.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { AttachmentPost } from './attachment-post.entity';
import { LanguageCode } from '../../user/enums/language-code';
import { PostCategory } from '../categories/entities/post-category.entity';
import { SubjectType } from '../enum/subject-type';
import { Category } from '../categories/entities/category.entity';

@Entity()
@Unique(['key'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'varchar', length: 600 })
  key?: string;

  @Column()
  name: string;

  @Column({ default: SubjectType.WELLNESS })
  subjectType: SubjectType;

  @Column({ nullable: true, type: 'text' })
  description?: string;
  // user related attributes
  likedByMe: boolean;
  disLikedByMe: boolean;
  viewsByMe: number;
  viewedByMe: boolean;

  languageCode: LanguageCode;
  title: string;
  html?: string;
  quillData?: JSON;
  externalUrl?: string;
  // @Exclude()
  primaryAttachment?: Attachment;
  secondaryAttachment?: Attachment;

  @Exclude()
  attachmentPosts: AttachmentPost[];
  @OneToMany(() => PostCategory, (postCategory) => postCategory.post)
  postCategories: PostCategory[];
  @Column({ default: 0 })
  views?: number;
  @Column()
  type: PostType;
  @Column({ default: PostContentType.OTHER })
  contentType: PostContentType;

  // get fetched and not depend on publishedAt or unpublishedAt
  @Column({ default: false })
  alwaysVisible: boolean;
  // only visible ones is true will get fetched
  @Column({ default: true })
  visible: boolean;
  @Exclude()
  @OneToMany(() => TagPost, (tagPost) => tagPost.post)
  tagPosts: TagPost[];

  @Exclude()
  @OneToMany(() => UserPost, (userPost) => userPost.post)
  userPosts: UserPost[];
  // @Column({ nullable: true })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  publishedAt: Date;
  @Column({ nullable: true })
  unpublishedAt?: Date;
  @CreateDateColumn()
  createdAt: Date;

  // @Expose({ name: 'primaryImageUrl' })
  // get primaryImageUrl(): string {
  //   return this.primaryImageAttachment?.url;
  // }
  //
  // @Expose({ name: 'imageAttachmentsUrls' })
  // get imageAttachmentsUrls(): string[] {
  //   return this.attachmentPosts?.map((value) => value.attachment.url);
  // }
  //
  //
  // @OneToMany(() => AttachmentPost, (attachmentPost) => attachmentPost.post)
  // @Exclude()
  // attachmentPosts: AttachmentPost[];
  //
  // @OneToOne(() => Attachment, (attachment) => attachment.primaryPost, {
  //   nullable: true,
  //   onDelete: 'SET NULL',
  // })
  // @Exclude()
  // @JoinColumn()
  // primaryImageAttachment?: Attachment;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @Column({ default: false })
  isPremium: boolean;
  // related posts
  @Exclude()
  @OneToMany(() => PostRelatedPost, (relatedPost) => relatedPost.post, {
    // to have nested save
    cascade: true,
  })
  postRelatedPosts: PostRelatedPost[];
  // this fetch linked posts this current post
  @Exclude()
  @OneToMany(() => PostRelatedPost, (relatedPost) => relatedPost.related, {
    // to have nested save
    cascade: true,
  })
  linkedRelatedPosts: PostRelatedPost[];
  @OneToMany((type) => PostTranslation, (translation) => translation.base)
  translations: PostTranslation[];

  @Expose({ name: 'categories' })
  get categories(): Category[] {
    return this.postCategories?.map((value) => value.category);
  }

  @Expose({ name: 'primaryAttachmentUrl' })
  get primaryAttachmentUrl(): string {
    return this.primaryAttachment?.url;
  }

  @Expose({ name: 'secondaryAttachmentUrl' })
  get secondaryAttachmentUrl(): string {
    return this.secondaryAttachment?.url;
  }

  @Expose({ name: 'attachmentUrls' })
  get attachmentUrls(): string[] {
    return this.attachmentPosts?.map((value) => value.attachment?.url);
  }

  @Expose({ name: 'likes' })
  get likes(): number {
    return this.userPosts?.filter((value) => value.liked).length;
  }

  @Expose({ name: 'disLikes' })
  get disLikes(): number {
    return this.userPosts?.filter((value) => value.disliked).length;
  }

  @Expose({ name: 'tags' })
  get tags(): Tag[] {
    return this.tagPosts?.map((value) => value.tag);
  }

  @Expose({ name: 'relatedPosts' })
  get relatedPosts(): Post[] {
    return this.postRelatedPosts?.map((value) => value.related);
  }

  @Exclude()
  get route(): string {
    switch (this.type) {
      case PostType.ARTICLE:
        return `${AppRoutes.POST_ARTICLE}?id=${this.id}`;
      case PostType.STORY:
        return `${AppRoutes.POST_STORY}?id=${this.id}`;
      case PostType.EXTERNAL_URL:
        return `${AppRoutes.POST_URL}?id=${this.id}`;
    }
  }
}
