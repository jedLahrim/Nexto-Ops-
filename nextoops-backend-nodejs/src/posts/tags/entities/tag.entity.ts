import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { TagPost } from '../../entities/tag-post.entity';
import { SubjectType } from '../../enum/subject-type';
import { I18nContext } from 'nestjs-i18n';

export enum TagType {
  PREDEFINED = 'PREDEFINED',
  CUSTOM = 'CUSTOM',
}

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;

  @Column()
  alias: string;

  @Column()
  type: TagType;

  @Exclude()
  @OneToMany(() => TagPost, (tagPost) => tagPost.tag)
  tagPosts: TagPost[];

  @Column({ default: SubjectType.WELLNESS })
  subjectType: SubjectType;

  setI18n(i18n: I18nContext): Tag {
    this.name = i18n.t(`locale.${this.alias}`, { defaultValue: this.name });
    return this;
  }
}
