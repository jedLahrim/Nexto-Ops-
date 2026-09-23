import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionSetsService } from './permission-sets.service';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { UserTypeGuard } from '../user/guards/user-type.guard';
import { UserType } from '../user/enums/user-type.enum';

@Controller('permissions/sets')
@UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
export class PermissionSetsController {
  constructor(private readonly service: PermissionSetsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: { name: string; description?: string; modules: string[] }) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; modules?: string[] },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('seed')
  seed() {
    return this.service.seed();
  }
}
