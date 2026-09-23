import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PushNotificationDto } from './dto/push-notification.dto';
import { AppError } from '../commons/errors/app-error';
import {
  ERR_FCM_TOKEN_EXIST,
  ERR_INVALID_TOKEN,
  ERR_NOT_FOUND_USER,
  ERR_TOPIC_EXPIRED,
  ERR_TOPIC_QUOTA_EXCEEDED,
} from '../commons/errors/errors-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { FcmDevice } from './entities/fcm-device.entity';
import { In, Repository } from 'typeorm';
import { FcmSubscribedTopic } from './entities/fcm-subscribed-topic.entity';
import { User } from '../user/entities/user.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { FcmSubscribeDto } from './dto/fcm-subscribe.dto';
import { Pagination } from '../commons/pagination/pagination';
import { FilterNotificationDto, NotificationOrderBy } from './dto/filter-notification.dto';
import { Notification } from './entities/notification.entity';
import { PaginationDto } from '../commons/pagination/pagination.dto';
import * as admin from 'firebase-admin';
import { BatchResponse, Message, MulticastMessage } from 'firebase-admin/lib/messaging';
import { isEmpty } from 'lodash';
import { Aps } from 'firebase-admin/lib/messaging/messaging-api';
import { splitArray } from '../commons/utils';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { NotificationContentDto } from './dto/notification-content.dto';
import { NotificationType } from './enum/notification-type.enum';
import { Post } from '../posts/entities/post.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(FcmDevice)
    private fcmDeviceRepo: Repository<FcmDevice>,
    @InjectRepository(FcmSubscribedTopic)
    private fcmSubscribedTopicRepo: Repository<FcmSubscribedTopic>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private eventEmitter: EventEmitter2,
    private readonly i18nService: I18nService,
  ) {}

  async pushNotification(dto: PushNotificationDto, skipSaving: boolean = false, sendForAll: boolean = false) {
    try {
      const { userId, userIds, token, tokens, notification, data, topic } = dto;

      // allUsers is the topic for all user by default from FCM
      if (sendForAll) dto.topic = 'allUsers';
      else if (!userId && !tokens && !token && !topic && !userIds) return;

      if (userId) {
        return this._pushNotificationByUser(dto, userId, skipSaving);
      } else if (userIds) {
        return this._pushNotificationByUserIds(dto, userIds, skipSaving);
      } else if (token) {
        dto.tokens = [token];
        return this._sendToTokens(dto);
      } else if (tokens) {
        return this._sendToTokens(dto);
      } else {
        return this._sendToTokenOrTopic(dto);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async createDevice(createDeviceDto: CreateDeviceDto, user: User) {
    let { fcmToken, deviceType } = createDeviceDto;
    const founded = await this.fcmDeviceRepo.findOne({ where: { token: fcmToken } });
    if (founded) throw new ConflictException(new AppError(ERR_FCM_TOKEN_EXIST));

    // this._checkFailedTokens(response);
    const fcmDevice = this.fcmDeviceRepo.create({
      deviceType: deviceType,
      token: fcmToken,
      user: user,
    });
    return this.fcmDeviceRepo.save(fcmDevice);
  }

  async removeDevice(id: string) {
    return this.fcmDeviceRepo.delete(id);
  }

  async subscribeUserForTopic(subscribeDeviceDto: FcmSubscribeDto, user: User) {
    let { topic } = subscribeDeviceDto;
    const fcmSubscribedTopic = this.fcmSubscribedTopicRepo.create({
      topic: topic,
      user: user,
    });
    return this.fcmSubscribedTopicRepo.save(fcmSubscribedTopic);
  }

  async findAllTopics(dto: PaginationDto, user: User) {
    const query = this.fcmSubscribedTopicRepo.createQueryBuilder('fcmSubscribedTopic');
    query.andWhere('fcmSubscribedTopic.userId = :userId', { userId: user.id });

    query.take(dto.take);
    query.skip(dto.skip);
    const [data, total] = await query.getManyAndCount();

    return new Pagination<FcmSubscribedTopic>(data, total);
  }

  async findAll(dto: FilterNotificationDto, user: User) {
    let { orderBy, sortType } = dto;
    const query = await this.notificationRepo
      .createQueryBuilder('notification')
      .andWhere('notification.userId=:userId', { userId: user.id });

    switch (orderBy) {
      case NotificationOrderBy.UPDATED_AT:
        query.orderBy('updatedAt', sortType);
        break;
      case NotificationOrderBy.CREATED_AT:
        query.orderBy('createdAt', sortType);
        break;
    }

    query.take(dto.take);
    query.skip(dto.skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<Notification>(data, total);
  }

  _getNotificationMessage(dto: PushNotificationDto, isMultiCast: boolean = false): Message | MulticastMessage {
    const silently = dto.silently;
    const data = this._fcmStringifyData(dto);
    const aps: Aps = silently
      ? { contentAvailable: true }
      : {
          mutableContent: dto.mutable_content ?? true,
        };
    const to = isMultiCast
      ? {
          tokens: dto.tokens,
        }
      : {
          token: dto.token,
          topic: dto.topic,
        };
    const notification = silently ? {} : { notification: dto.notification };
    return {
      ...to,
      // this is available only for MulticastMessage
      data,
      ...notification,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps,
          headers: {
            'apns-priority': '5',
          },
        },
      },
    };
  }

  async createUserNotification(userId: string, dto: PushNotificationDto) {
    await this.createUsersNotification([userId], dto);
  }

  async createUsersNotification(userIds: string[], dto: PushNotificationDto) {
    const notifications = userIds.map((userId) => {
      return this.notificationRepo.create({
        title: dto.notification.title,
        type: dto.type,
        data: dto.data?.content?.payload,
        description: dto.notification.body,
        user: {
          id: userId,
        },
      });
    });

    await this.notificationRepo.save(notifications);
  }

  private async _pushNotificationByUser(dto: PushNotificationDto, userId: string, skipSaving: boolean = false) {
    const fcmDevices = await this._getUserFcmDevices(userId);

    if (!skipSaving) await this.createUserNotification(userId, dto);
    if (!fcmDevices || fcmDevices.length == 0) return;

    dto.tokens = fcmDevices.map((value) => value.token);
    await this._sendToTokens(dto);
  }

  private async _pushNotificationByUserIds(dto: PushNotificationDto, userIds: string[], skipSaving: boolean = false) {
    if (isEmpty(userIds)) return;
    const fcmDevices = await this._getUsersFcmDevices(userIds);
    if (!skipSaving) await this.createUsersNotification(userIds, dto);
    if (!fcmDevices || fcmDevices.length == 0) return;

    dto.tokens = fcmDevices.map((value) => value.token);

    await this._sendToTokens(dto);
  }

  private async _getUserFcmDevices(userId: string): Promise<FcmDevice[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { fcmDevices: true },
    });

    if (!user) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    return user.fcmDevices;
  }

  private async _getUsersFcmDevices(userIds: string[]): Promise<FcmDevice[]> {
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
      relations: { fcmDevices: true },
    });

    if (!users) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    const usersFcmDevices: FcmDevice[] = [];
    users.forEach((user) => usersFcmDevices.push(...user.fcmDevices));
    return usersFcmDevices;
  }

  private _checkToken(response) {
    if (response.data.failure != 0) throw new BadRequestException(new AppError(ERR_INVALID_TOKEN));
  }

  private async _sendToTokenOrTopic(dto: PushNotificationDto) {
    try {
      const message = this._getNotificationMessage(dto) as Message;
      const response = await admin.messaging().send(message);
      return { response };
    } catch (e) {
      /*if (e.code == ERR_INVALID_ARGUMENT || ERR_TOKEN_NOT_REGISTERED)
        await this.fcmDeviceRepo.delete({ token: dto.to });*/
      if (e.code == ERR_TOPIC_QUOTA_EXCEEDED) {
        throw new ConflictException(new AppError(ERR_TOPIC_EXPIRED));
      }
    }
  }

  private async _sendToTokens(dto: PushNotificationDto) {
    if (isEmpty(dto.tokens)) return;
    // because Firebase can't handle more than 500 tokens in single call.
    const tokensParts = splitArray(dto.tokens, 500);
    const message = this._getNotificationMessage(dto, true) as MulticastMessage;

    let allFailedFcmTokens = [];
    for (const tokens of tokensParts) {
      message.tokens = tokens;
      const response = await admin.messaging().sendEachForMulticast(message);
      const failedFcmTokens = this._failedFcmTokens(response, dto);
      if (failedFcmTokens) {
        // TODO Do not delete fcm device currently until we found out a solution to delete only inactive for big range of time
        // example send to multiple token when and failed one marked as inactive
        // if send again after and success we can mark inactive ones to active
        // BUT if inactive still inactive for 3-6 months as example then we can delete them.
        //  await this.fcmDeviceRepo.delete({ token: In(failedFcmTokens) });
      }
    }

    const successFcmTokens = this._successFcmTokens(dto, allFailedFcmTokens);

    if (dto.webhook) console.log(`[webhook notification] pushing successfully dto ${successFcmTokens}`);
    return {
      successFcmTokens: successFcmTokens ?? [],
      failedFcmTokens: allFailedFcmTokens ?? [],
    };
  }

  private _failedFcmTokens(response: BatchResponse, dto: PushNotificationDto) {
    if (response.failureCount > 0) {
      const failedFcmTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedFcmTokens.push(dto.tokens[idx]);
        }
      });
      return failedFcmTokens;
    }
  }

  private _successFcmTokens(dto: PushNotificationDto, failedTokens): string[] {
    return dto.tokens.filter((element) => !failedTokens?.includes(element));
  }

  private _fcmStringifyData(notificationData) {
    if (!notificationData.data) return undefined;
    const data = {
      ...notificationData.data,
    };
    if (notificationData.data.content) data.content = JSON.stringify(notificationData.data.content);
    if (notificationData.data.actionButtons) data.actionButtons = JSON.stringify(notificationData.data.actionButtons);
    if (notificationData.data.schedule) data.schedule = JSON.stringify(notificationData.data.schedule);
    if (notificationData.data.localizations) data.localizations = JSON.stringify(notificationData.data.localizations);

    return data;
  }

  private _getPushNotificationDto(
    userId: string,
    titleKey: string,
    bodyKey: string,
    i18n: I18nContext,
    route: string,
    post: Post,
    options?: TranslateOptions,
  ): PushNotificationDto {
    return {
      notification: {
        title: i18n.t(titleKey, options),
        body: i18n.t(bodyKey, options),
      },
      data: {
        content: new NotificationContentDto({
          payload: {
            route: route,
            notificationType: NotificationType.REDIRECT,
          },
          bigPicture: post.primaryAttachmentUrl,
        }),
      },
      type: NotificationType.REDIRECT,
      userId,
    };
  }
}
