import { Module } from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { TutorialsController } from './tutorials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Tutorial } from './entities/tutorial.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { User } from '../user/entities/user.entity';
import { UserTutorial } from './entities/user-tutorial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tutorial, Attachment, User, UserTutorial])],
  controllers: [TutorialsController],
  providers: [TutorialsService, AttachmentsService],
})
export class TutorialsModule {}
