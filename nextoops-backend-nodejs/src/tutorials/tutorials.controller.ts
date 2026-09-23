import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { FilterTutorialDto } from './dto/filter-tutorial.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { UserPermissionsType } from '../user/enums/user-permission.enum';
import { PermissionGuard } from '../user/guards/permission.guard';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { CustomCacheInterceptor } from '../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { ONE_HOUR } from '../commons/utils';

@Controller('tutorials')
@UseGuards(JwtAuthGuard)
export class TutorialsController {
  constructor(private readonly tutorialsService: TutorialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_TUTORIALS))
  create(@Body() createTutorialDto: CreateTutorialDto, @GetUser() user: User) {
    return this.tutorialsService.create(createTutorialDto, user);
  }

  @Get()
  @CacheTTL(ONE_HOUR)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TUTORIALS))
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  findAll(@Query() filterTutorialDto: FilterTutorialDto, @GetUser() user: User) {
    return this.tutorialsService.findAll(filterTutorialDto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TUTORIALS))
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.tutorialsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_TUTORIALS))
  update(@Param('id') id: string, @Body() updateTutorialDto: UpdateTutorialDto, @GetUser() user: User) {
    return this.tutorialsService.update(id, updateTutorialDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_TUTORIALS))
  remove(@Param('id') id: string, @Body('archive') archive: boolean) {
    return this.tutorialsService.remove(id, archive);
  }

  @Post(':id/viewed')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TUTORIALS))
  viewed(@Param('id') id: string, @GetUser() user: User) {
    return this.tutorialsService.viewed(id, user);
  }
}
