import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [DepartmentsModule, RoomsModule],
  exports: [DepartmentsModule, RoomsModule],
})
export class OrganizationModule {}
