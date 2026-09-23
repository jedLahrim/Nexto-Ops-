import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSet } from './entities/permission-set.entity';
import { PermissionSetsService } from './permission-sets.service';
import { PermissionSetsController } from './permission-sets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionSet])],
  controllers: [PermissionSetsController],
  providers: [PermissionSetsService],
  exports: [PermissionSetsService],
})
export class PermissionSetsModule {}
