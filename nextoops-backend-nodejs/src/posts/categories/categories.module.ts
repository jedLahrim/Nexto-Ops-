import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashGuard } from 'src/user/guards/hash.guard';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { Category } from './entities/category.entity';
import { AttachmentsModule } from '../../attachments/attachments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), AttachmentsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtAuthGuard, HashGuard],
})
export class CategoriesModule {}
