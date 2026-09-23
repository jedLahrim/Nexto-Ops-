import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Attachment } from '../../../attachments/entities/attachment.entity';
import { Expose } from 'class-transformer';
import { PostCategory } from './post-category.entity';
import { SubjectType } from '../../enum/subject-type';
import { I18nContext } from 'nestjs-i18n';

export enum CategoryBasedOn {
  PREGNANCY_TRIMESTER = 'PREGNANCY_TRIMESTER',
  PREGNANCY_WEEK = 'PREGNANCY_WEEK',
}

@Unique(['key'])
@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  alias: string;

  @Column()
  key: string;

  @Column({ default: SubjectType.WELLNESS })
  subjectType: SubjectType;

  @Column({ nullable: true })
  basedOn?: CategoryBasedOn;

  @Column({ nullable: true })
  trimester?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
  @OneToOne(() => Attachment, (attachment) => attachment.category, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  // @Exclude()
  @JoinColumn()
  imageAttachment?: Attachment;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @OneToMany(() => PostCategory, (postCategory) => postCategory.category)
  postCategories: PostCategory[];

  @Expose({ name: 'imageUrl' })
  get imageUrl(): string {
    return this.imageAttachment?.url;
  }

  setI18n(i18n: I18nContext): Category {
    this.name = i18n.t(`locale.${this.alias}`, { defaultValue: this.name });
    return this;
  }
}
