import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { PermissionGuard } from '../user/guards/permission.guard';
import { UserPermissionsType } from '../user/enums/user-permission.enum';
import { FilterPostDto } from './dto/filter-post.dto';
import { HashGuard } from '../user/guards/hash.guard';
import { AuthOrHashGuard } from '../user/guards/auth-or-hash/auth-or-hash.guard';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { I18n, I18nContext } from 'nestjs-i18n';
import { CreatePostTranslationDto } from './dto/create-post-translation.dto';
import { UpdatePostTranslationDto } from './dto/update-post-translation.dto';
import { UserTypeGuard } from '../user/guards/user-type.guard';
import { UserType } from '../user/enums/user-type.enum';
import { CustomCacheInterceptor } from '../interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from '../interceptors/transform-cache-response-interceptor.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { ONE_HOUR } from '../commons/utils';
import { Constant } from '../commons/constant';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_POSTS))
  create(@Body() createPostDto: CreatePostDto, @I18n() i18n: I18nContext, @GetUser() me: User) {
    return this.postsService.create(createPostDto, i18n, me);
  }

  @Get()
  @CacheTTL(Constant.CacheTTL())
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_POSTS))
  findAll(@Query() dto: FilterPostDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.postsService.findAll(dto, me, i18n);
  }

  @Get(':id')
  @CacheTTL(ONE_HOUR)
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  @UseGuards(AuthOrHashGuard)
  findOne(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.findOne(id, me, i18n);
  }

  @Get('key/:key')
  @UseGuards(JwtAuthGuard)
  findOneByKey(@Param('key') key: string, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.postsService.findOneByKey(key, me, i18n);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_LIKE_DISLIKE_POSTS))
  like(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.likeDislike(id, me, i18n, true);
  }

  @Post(':id/like-dislike/reset')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_LIKE_DISLIKE_POSTS))
  resetLikeDislike(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.likeDislike(id, me, i18n, false, false);
  }

  @Post(':id/notify-later')
  @UseGuards(JwtAuthGuard)
  notifyLater(@Param('id') id: string, @I18n() i18n: I18nContext, @GetUser() me: User) {
    return this.postsService.notifyLater(id, i18n, me);
  }

  @Post(':id/disLike')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_LIKE_DISLIKE_POSTS))
  disLike(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.likeDislike(id, me, i18n, false, true);
  }

  @Post(':id/viewed')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_POSTS))
  viewed(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.viewed(id, me, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_POSTS))
  update(
    @GetUser() me: User,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @I18n() i18n: I18nContext,
  ) {
    return this.postsService.update(id, updatePostDto, me, i18n);
  }

  @Patch('tag/:tagId')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  updateCategoryByTagId(@GetUser() me: User, @Param('tagId') tagId: string, @Body('categoryId') categoryId: string) {
    return this.postsService.updateCategoryByTagId(tagId, categoryId, me);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_POSTS))
  remove(@GetUser() me: User, @Param('id') id: string) {
    return this.postsService.remove(id);
  }

  @Post(':id/share')
  @UseGuards(HashGuard)
  share(@GetUser() me: User, @Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.postsService.share(id, i18n, me);
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_POSTS))
  createTranslation(
    @Param('id') id: string,
    @Body() dto: CreatePostTranslationDto,
    @I18n() i18n: I18nContext,
    @GetUser() me: User,
  ) {
    return this.postsService.createTranslation(id, dto, i18n, me);
  }

  @Patch('translations/:postTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_POSTS))
  updateTranslation(
    @Param('postTranslationId') postTranslationId: string,
    @Body() dto: UpdatePostTranslationDto,
    @GetUser() me: User,
    @I18n() i18n: I18nContext,
  ) {
    return this.postsService.updateTranslation(postTranslationId, dto, me, i18n);
  }

  @Get('translations/:postTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_POSTS))
  findOneTranslation(
    @Param('postTranslationId') postTranslationId: string,
    @GetUser() me: User,
    @I18n() i18n: I18nContext,
  ) {
    return this.postsService.findOneTranslation(postTranslationId, me);
  }
}
