import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Tag } from './tags/entities/tag.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { User } from '../user/entities/user.entity';
import { ShareService } from '../share/share.service';
import { UserPost } from './entities/user-post.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { HashGuard } from '../user/guards/hash.guard';
import { AttachmentPost } from './entities/attachment-post.entity';
import { TagPost } from './entities/tag-post.entity';
import { BullModule } from '@nestjs/bull';
import { NotifyLaterProcessor } from './queue/notify-later.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostRelatedPost } from './entities/related-post.entity';
import { PostTranslation } from './entities/post-translation.entity';
import { PostCategory } from './categories/entities/post-category.entity';
import { Category } from './categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attachment,
      Post,
      PostTranslation,
      PostRelatedPost,
      Tag,
      User,
      UserPost,
      AttachmentPost,
      TagPost,
      PostCategory,
      Category,
    ]),
    BullModule.registerQueue({
      name: 'notify_me_later_queue',
    }),
    NotificationsModule,
  ],
  providers: [PostsService, AttachmentsService, ShareService, JwtAuthGuard, HashGuard, NotifyLaterProcessor],
  controllers: [PostsController],
  exports: [PostsService, NotifyLaterProcessor],
})
export class PostsModule {}
