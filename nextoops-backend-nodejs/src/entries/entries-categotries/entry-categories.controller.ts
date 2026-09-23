import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { PermissionGuard } from '../../user/guards/permission.guard';
import { UserPermissionsType } from '../../user/enums/user-permission.enum';
import { CustomCacheInterceptor } from '../../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Constant } from '../../commons/constant';
import { EntryCategoriesService } from './entry-categories.service';
import { CreateEntryCategoryDto } from './dto/create-entries-categotry.dto';
import { UpdateEntriesCategotryDto } from './dto/update-entries-categotry.dto';
import { FilterEntryCategoryDto } from './dto/filter-entry-category.dto';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/entities/user.entity';

@Controller('entry-categories')
@UseGuards(JwtAuthGuard)
export class EntryCategoriesController {
  constructor(private readonly entryCategoriesService: EntryCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_ENTRY_CATEGORY))
  create(@Body() dto: CreateEntryCategoryDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.entryCategoriesService.create(dto, me, i18n);
  }

  @Get()
  @CacheTTL(Constant.CacheTTL())
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_ENTRY_CATEGORY))
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  findAll(@Query() dto: FilterEntryCategoryDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.entryCategoriesService.findAll(dto, me, i18n);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_ENTRY_CATEGORY))
  findOne(@Param('id') id: string, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.entryCategoriesService.findOne(id, me, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_ENTRY_CATEGORY))
  update(@Param('id') id: string, @Body() dto: UpdateEntriesCategotryDto,@GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.entryCategoriesService.update(id, dto,me, i18n);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_ENTRY_CATEGORY))
  remove(@Param('id') id: string) {
    return this.entryCategoriesService.remove(id);
  }
}
