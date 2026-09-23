import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UserPermissionsType } from '../../user/enums/user-permission.enum';
import { PermissionGuard } from '../../user/guards/permission.guard';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { AuthOrHashGuard } from '../../user/guards/auth-or-hash/auth-or-hash.guard';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CustomCacheInterceptor } from '../../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Constant } from '../../commons/constant';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_CATEGORY))
  create(@Body() createCategoryDto: CreateCategoryDto, @I18n() i18n: I18nContext) {
    return this.categoriesService.create(createCategoryDto, i18n);
  }

  // @Version('1')
  @Get()
  @CacheTTL(Constant.CacheTTL())
  @UseGuards(AuthOrHashGuard)
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  findAll(@Query() dto: FilterCategoryDto, @I18n() i18n: I18nContext) {
    return this.categoriesService.findAll(dto, i18n);
  }

  // @Version('2')
  // @Get()
  // @UseGuards(AuthOrHashGuard)
  // @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  // findAllV2(@Query() dto: FilterCategoryDto, @I18n() i18n: I18nContext) {
  //   return 'findAllV2 categories';
  // }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_CATEGORY))
  findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.categoriesService.findOne(id, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_CATEGORY))
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @I18n() i18n: I18nContext) {
    return this.categoriesService.update(id, updateCategoryDto, i18n);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_CATEGORY))
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
