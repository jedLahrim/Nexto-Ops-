import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserType } from '../../user/enums/user-type.enum';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { Exclude, Expose } from 'class-transformer';
import { UserTutorial } from './user-tutorial.entity';

@Entity()
export class Tutorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  @Column({ nullable: true, type: 'text' })
  key?: string;
  userType: UserType;
  @Expose({ name: 'viewed' })
  viewed: boolean;
  @OneToOne(() => Attachment, (attachment) => attachment.tutorial, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @Exclude()
  @JoinColumn()
  videoAttachment: Attachment;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @OneToMany(() => UserTutorial, (userTutorial) => userTutorial.tutorial)
  @Exclude()
  userTutorials: UserTutorial[];

  @Expose({ name: 'videoUrl' })
  get videoUrl() {
    return this.videoAttachment?.url;
  }

  setUserViewed(userId: string) {
    const userTutorial = this.userTutorials?.find((userTutorial) => userTutorial.userId == userId);
    this.viewed = userTutorial?.viewed ?? false;
  }
}
