import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UseCaseCategoriesService } from './use-case-categories.service';
import { CreateUseCaseCategoryDto } from './dto/create-use-case-category.dto';
import { UpdateUseCaseCategoryDto } from './dto/update-use-case-category.dto';
import { FilterInsightCategoryDto } from './dto/filter-insight-category.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { PermissionGuard } from '../../user/guards/permission.guard';
import { UserPermissionsType } from '../../user/enums/user-permission.enum';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/entities/user.entity';

@Controller('ai/categories')
export class UseCaseCategoriesController {
  constructor(private readonly categoriesService: UseCaseCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_USE_CASE_CATEGORY))
  create(@Body() createCategoryDto: CreateUseCaseCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_USE_CASE_CATEGORY))
  findAll(@Query() dto: FilterInsightCategoryDto, @GetUser() user: User) {
    return this.categoriesService.findAll(dto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_USE_CASE_CATEGORY))
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_USE_CASE_CATEGORY))
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateUseCaseCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_USE_CASE_CATEGORY))
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
