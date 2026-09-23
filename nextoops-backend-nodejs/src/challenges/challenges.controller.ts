import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { UserPermissionsType } from 'src/user/enums/user-permission.enum';
import { CustomCacheInterceptor } from 'src/interceptors/custom-cache-inerceptor.interceptor';
import { TransformCacheResponseInterceptor } from 'src/interceptors/transform-cache-response-interceptor.interceptor';
import { GetUser } from 'src/user/get-user.decorator';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/user/guards/permission.guard';
import { User } from 'src/user/entities/user.entity';
import { I18n, I18nContext } from 'nestjs-i18n';
import { FilterChallengeDto } from './dto/filter-challenge.dto';
import { CreateChallengeTranslationDto } from './dto/create-challenge-translation.dto';
import { UpdateChallengeTranslationDto } from './dto/update-challenge-translation.dto';
import { Constant } from '../commons/constant';
import { CacheTTL } from '@nestjs/cache-manager';

@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_CHALLENGE))
  create(@Body() dto: CreateChallengeDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.create(dto, me, i18n);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_CHALLENGE))
  findAll(@Query() dto: FilterChallengeDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.findAll(dto, me, i18n);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_CHALLENGE))
  findOne(@Param('id') id: string, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.findOne(id, me, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_CHALLENGE))
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.update(id, dto, me, i18n);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_CHALLENGE))
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  start(@Param('id') id: string, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.startChallenge(id, me, i18n);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  end(@Param('id') id: string, @GetUser() me: User, @I18n() i18n: I18nContext) {
    return this.challengesService.endChallenge(id, me, i18n);
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_CHALLENGE))
  createTranslation(
    @Param('id') id: string,
    @Body() dto: CreateChallengeTranslationDto,
    @I18n() i18n: I18nContext,
    @GetUser() me: User,
  ) {
    return this.challengesService.createTranslation(id, dto, i18n, me);
  }

  @Patch('translations/:challengeTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_CHALLENGE))
  updateTranslation(
    @Param('challengeTranslationId') challengeTranslationId: string,
    @Body() dto: UpdateChallengeTranslationDto,
    @GetUser() me: User,
    @I18n() i18n: I18nContext,
  ) {
    return this.challengesService.updateTranslation(challengeTranslationId, dto, me, i18n);
  }

  @Get('translations/:challengeTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_CHALLENGE))
  findOneTranslation(
    @Param('challengeTranslationId') challengeTranslationId: string,
    @GetUser() me: User,
    @I18n() i18n: I18nContext,
  ) {
    return this.challengesService.findOneTranslation(challengeTranslationId, me);
  }
}
