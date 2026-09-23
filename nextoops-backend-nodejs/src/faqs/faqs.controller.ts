import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { FilterFaqDto } from './dto/filter-faq.dto';
import { PermissionGuard } from '../user/guards/permission.guard';
import { UserPermissionsType } from '../user/enums/user-permission.enum';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { CustomCacheInterceptor } from '../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { ONE_HOUR } from '../commons/utils';

@Controller('faqs')
@UseGuards(JwtAuthGuard)
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_FAQ))
  create(@Body() createFaqDto: CreateFaqDto, @GetUser() user: User) {
    return this.faqsService.create(createFaqDto, user);
  }

  @Get()
  @CacheTTL(ONE_HOUR)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_FAQ))
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  findAll(@Query() filterTutorialDto: FilterFaqDto) {
    return this.faqsService.findAll(filterTutorialDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_FAQ))
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.faqsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_FAQ))
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto, @GetUser() user: User) {
    return this.faqsService.update(id, updateFaqDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_FAQ))
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }
}
