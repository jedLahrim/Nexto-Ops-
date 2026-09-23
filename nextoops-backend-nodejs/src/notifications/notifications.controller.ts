import { Body, ConflictException, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDto, PushLocaleNotificationDto, PushNotificationDto } from './dto/push-notification.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { User } from '../user/entities/user.entity';
import { GetUser } from '../user/get-user.decorator';
import { FcmSubscribeDto } from './dto/fcm-subscribe.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { PaginationDto } from '../commons/pagination/pagination.dto';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { AppError } from '../commons/errors/app-error';
import { ERR_NOTIFICATION } from '../commons/errors/errors-codes';
import { PushDailyPregnancyNotificationDto } from '../user/dto/push-daily-pregnancy-notification.dto';
import { I18nService } from 'nestjs-i18n';
import { SimpleHashGuard } from './guard/simple-hash.guard';
import { getI18nContextByLang } from '../commons/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly i18nService: I18nService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post('push')
  pushNotification(@Body() dto: PushNotificationDto) {
    if (!dto.userId && !dto.tokens && !dto.token && !dto.topic && !dto.userIds) {
      throw new ConflictException(new AppError(ERR_NOTIFICATION));
    }
    if (dto.webhook) console.log(`[webhook notification] pushing successfully dto ${JSON.stringify(dto)}`);

    return this.notificationsService.pushNotification(dto);
  }

  @Post('push-locale')
  async pushNotificationByLocaleKeys(@Body() dto: PushLocaleNotificationDto) {
    const user = await this.userRepo.findOneOrFail({ where: { id: dto.userId } });
    const i18n = getI18nContextByLang(user.contentLanguageCode, this.i18nService);
    const { titleAlias, bodyAlias, imageUrl } = dto.notification;
    const title = i18n.t(`locale.${titleAlias}`);
    const body = i18n.t(`locale.${bodyAlias}`);
    const notification = new NotificationDto(title, body, imageUrl);
    const pushNotificationDto = new PushNotificationDto({ ...dto, notification });
    return this.notificationsService.pushNotification(pushNotificationDto);
  }

  @Post('/device/create')
  @UseGuards(JwtAuthGuard)
  createDevice(@Body() createDeviceDto: CreateDeviceDto, @GetUser() user: User) {
    return this.notificationsService.createDevice(createDeviceDto, user);
  }

  @Post('/topics/subscribe')
  @UseGuards(JwtAuthGuard)
  subscribeUserForTopic(@Body() fcmSubscribeDto: FcmSubscribeDto, @GetUser() user: User) {
    return this.notificationsService.subscribeUserForTopic(fcmSubscribeDto, user);
  }

  @Get('/topics')
  @UseGuards(JwtAuthGuard)
  findAllTopics(@Query() dto: PaginationDto, @GetUser() user: User) {
    return this.notificationsService.findAllTopics(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() filterNotificationDto: FilterNotificationDto, @GetUser() user: User) {
    return this.notificationsService.findAll(filterNotificationDto, user);
  }
}
