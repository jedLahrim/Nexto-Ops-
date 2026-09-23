import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { PermissionGuard } from '../../user/guards/permission.guard';
import { UserPermissionsType } from '../../user/enums/user-permission.enum';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { CustomCacheInterceptor } from '../../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Constant } from '../../commons/constant';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_TAG))
  create(@Body() createTagDto: CreateTagDto, @I18n() i18n: I18nContext) {
    return this.tagsService.create(createTagDto, i18n);
  }

  @Post('/many')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_TAG))
  createMany(@Body() createTagDtos: CreateTagDto[], @I18n() i18n: I18nContext) {
    return this.tagsService.createMany(createTagDtos, i18n);
  }

  @Get()
  @CacheTTL(Constant.CacheTTL())
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TAG))
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  findAll(@Query() dto: PaginationDto, @I18n() i18n: I18nContext) {
    return this.tagsService.findAll(dto, i18n);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TAG))
  findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.tagsService.findOne(id, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_TAG))
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto, @I18n() i18n: I18nContext) {
    return this.tagsService.update(id, updateTagDto, i18n);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_TAG))
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
