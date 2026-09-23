import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { first, isEmpty, orderBy } from 'lodash';
import * as MauticConnector from 'node-mautic';
import { AppError } from '../../commons/errors/app-error';
import { ERR_MAUTIC } from '../../commons/errors/errors-codes';
import { CreateMauticContactDto } from './dto/create-mautic-contact.dto';
import { UpdateMauticContactDto } from './dto/update-mautic-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatistics } from '../../user/entities/user.entity';
import { In, Repository } from 'typeorm';
import { Constant } from '../../commons/constant';
import { ExportDataService } from '../../exports/export-data/export-data.service';
import { ExportType } from '../../exports/export-data/enum/export-type.enum';
import { Response } from 'express';
import { ExportProvider } from '../../exports/export-data/enum/export-provider.enum';
import { UserType } from '../../user/enums/user-type.enum';
import { createBasicAuthToken, splitArray } from '../../commons/utils';
import axios from 'axios';
import { EasyDebounce } from '../../commons/easy-debounce';
import { ExportDataDto } from '../../user/dto/export-data.dto';

@Injectable()
export class MauticService {
  mautic?: MauticConnector;
  MAUTIC_API_URL: string;
  MAUTIC_API_KEY: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private exportChildDataService: ExportDataService,
  ) {
    this.MAUTIC_API_KEY = this.configService.get('MAUTIC_API_KEY');
    this.MAUTIC_API_URL = configService.get('MAUTIC_API_URL');
    if (Constant.ENABLE_MAUTIC && !isEmpty(this.MAUTIC_API_KEY)) {
      this.mautic = new MauticConnector({
        apiUrl: this.MAUTIC_API_URL,
        username: 'api',
        password: this.MAUTIC_API_KEY,
        timeoutInSeconds: 5,
        logLevel: 'error',
      });
    }
  }

  // createList(createMauticDto: CreateMauticDto) {
  //   return 'This action adds a new mautic';
  // }

  async findAllLists() {
    try {
      const response = await this.mautic.contacts.listContacts({});
      return response;
    } catch (e) {
      throw new ConflictException(new AppError(ERR_MAUTIC));
    }
  }

  // async findOneList(name: string) {
  //   let lists: Array<any>;
  //   try {
  //     const response = await this.mautic.lists.getAllLists();
  //     lists = response.lists;
  //   } catch (e) {
  //     throw new ConflictException(new AppError(ERR_MAUTIC));
  //   }
  //
  //   if (lists && !isEmpty(lists)) {
  //     const foundedList = lists.find((list) => list.name == name);
  //     return foundedList ?? first(lists);
  //   } else {
  //     throw new NotFoundException(new AppError(ERR_NOT_FOUND_AUDIENCE));
  //   }
  // }

  async createContact(dto: CreateMauticContactDto) {
    const data = dto.data;
    return this.mautic.contacts.createContact(data);
  }

  findAllContact() {
    return `This action returns all mautic`;
  }

  async findOneContact(email: string, mailingId?: number): Promise<number> {
    return mailingId ? this._getContactByMailingId(mailingId) : this._getContactByEmail(email);
  }

  async _getContactByMailingId(mailingId: number) {
    try {
      await this.mautic.contacts.getContact(mailingId);
      return mailingId;
    } catch (e) {
      return null;
    }
  }

  async _getContactByEmail(email: string) {
    try {
      const response = await this.mautic.contacts.getContactByEmailAddress(email);
      const keys = Object.keys(response.contacts);
      const mailingId = response.contacts[first(keys)].id;
      if (mailingId) await this.userRepo.update({ email: email }, { mailingId });
      return mailingId;
    } catch (e) {
      return null;
    }
  }

  async updateContact(mailingId: number, dto: UpdateMauticContactDto) {
    return this.mautic.contacts.editContact('PATCH', dto.data, mailingId);
  }

  async removeContact(email: string, mailingId?: number) {
    const contactId = await this.findOneContact(email, mailingId);
    if (!contactId) return null;

    const response = await this.mautic.contacts.deleteContact(contactId);
    return response;
  }

  async _handleUserUpdateEvent(userId: string, reason?: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        subscriptions: true,
      },
    });

    const founded = await this.findOneContact(user.email, user.mailingId);
    if (founded) {
      console.log(`[MAUTIC] [UPDATED] user=${user.email} ${reason}`);
      return this._handleUserUpdated(user, founded);
    } else {
      console.log(`[MAUTIC] [CREATED] user=${user.email} ${reason}`);
      return this._handleUserCreated(user);
    }
  }

  async handleUserUpdateEvent(userId: string, reason?: string) {
    const tag = `handle_user_update_event_${userId}`;
    if (Constant.ENABLE_MAUTIC_DEBOUNCE)
      EasyDebounce.debounce(tag, 10000, () => this._handleUserUpdateEvent(userId, reason));
    else {
      return this._handleUserUpdateEvent(userId, reason);
    }
  }

  async exportContacts(res: Response, refreshStatistics?: boolean) {
    const usersChuck1 = await this.userRepo.find({
      where: [{ type: UserType.MEMBER }, { type: UserType.PARTNER }, { type: UserType.DOCTOR }],
      relations: {
        subscriptions: true,
        profileImageAttachment: true,
      },
    });

    const ids = usersChuck1.map((value) => value.id);

    const usersChuck2 = await this.userRepo.find({
      where: { id: In(ids) },
    });

    const users = usersChuck1.map((user) => {
      const founded = usersChuck2.find((value) => value.id == user.id);
      if (founded) {
        // user.dailyNotes = founded.dailyNotes;
      }
      return user;
    });

    const usersIncludingStatistics = users.map((user) => {
      let statistics: UserStatistics;
      statistics = {
        // totalDailyNote: user.dailyNotes?.length ?? 0,
      };
      user.statistics = statistics;
      return user;
    });

    if (refreshStatistics) await this.userRepo.save(usersIncludingStatistics, { chunk: 100 });

    const data = usersIncludingStatistics.map((user) => this._getContactData(user, true));

    let exportData = new ExportDataDto(data, '');
    await this.exportChildDataService.export(
      [exportData],
      'contacts',
      ExportType.EXCEL,
      ['Emailing Contacts'],
      res,
      ExportProvider.EXCEL_JS,
    );
  }

  async getAllContactsByChucks(chunkSize: number = Constant.MAX_CHUNK_MAUTIC_PRE_REQUEST) {
    const usersChuck1 = await this.userRepo.find({
      where: [{ type: UserType.MEMBER }, { type: UserType.PARTNER }, { type: UserType.DOCTOR }],
      relations: {
        subscriptions: true,
        profileImageAttachment: true,
      },
    });

    const ids = usersChuck1.map((value) => value.id);

    const usersChuck2 = await this.userRepo.find({
      where: { id: In(ids) },
      relations: {
        // dailyNotes: true,
      },
    });

    const users = usersChuck1.map((user) => {
      const founded = usersChuck2.find((value) => value.id == user.id);
      if (founded) {
        // user.dailyNotes = founded.dailyNotes;
      }
      return user;
    });

    const usersIncludingStatistics = users.map((user) => {
      let statistics: UserStatistics;
      statistics = {
        // totalDailyNote: user.dailyNotes?.length ?? 0,
      };
      user.statistics = statistics;
      return user;
    });

    const listData = usersIncludingStatistics.map((user) => this._getContactData(user, false));
    // 200 is max chunk for mautic request
    const listDataParts = splitArray(listData, chunkSize);
    return {
      listDataParts,
    };
  }

  _getUpdateContactDto(user: User) {
    const data = this._getContactData(user);

    const dto = new CreateMauticContactDto({
      data,
    });
    return dto;
  }

  _getContactData(user: User, forExport?: boolean) {
    let tags = [];

    const data = {
      user_id: user.id,
      email: user.email,
      firstname: user.firstName ?? '',
      lastname: user.lastName ?? '',
      is_premium: user.isVip || user.hasSubscriptionActive(Constant.PLUS_ENTITLEMENT_ID),
      user_type: user.type ?? '',
      full_name: user.fullName ?? '',
      first_login_at: user.firstLoginAt?.toISOString() ?? '',
      last_login_at: user.lastLoginAt?.toISOString() ?? '',
      birthday_at: user.birthdayAt?.toISOString() ?? '',
      total_entry: user.statistics?.totalEntry ?? 0,
      total_entry_words: user.statistics?.totalEntryWords ?? 0,
      // total_partners: user.statistics?.totalPartners ?? 0,
      tracked_days: user.statistics?.totalEntryWords ?? 0,
      last_tracked_day_at: user.statistics?.lastTrackedDayAt ?? 0,
      total_insights: user.statistics?.totalInsights ?? 0,
      register_provider_type: user.registerProviderType ?? '',
      is_demo: user.isDemo,
      is_vip: user.isVip,
      last_active: user.lastLoginAt?.toISOString() ?? '',
      app_version: user.appVersion,
      timezone: user.timezone,
      language_code: user.languageCode,
      preferred_locale: user.contentLanguageCode,
      allow_notifications: user.allowNotifications,
      allow_emails: user.allowEmails,
      tags: isEmpty(tags) ? '' : forExport ? `${tags.join(', ')}` : tags,
      // preferredProfileImage: instanceToPlain(user).profileImageUrl,
      // preferredProfileImage: imageUrl,
      // preferred_profile_image: 'CUSTOM',
      // lead: {
      //   preferred_profile_image: 'custom',
      //   custom_avatar: imageUrl,
      // },

      // extraData: user.extraData,
    };

    return data;
  }

  async _handleUserCreatedEvent(userId: string) {
    let user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        subscriptions: true,
      },
    });
    return this._handleUserCreated(user);
  }

  async handleUserCreatedEvent(userId: string) {
    const tag = `handle_user_created_event_${userId}`;
    if (Constant.ENABLE_MAUTIC_DEBOUNCE) EasyDebounce.debounce(tag, 10000, () => this._handleUserCreatedEvent(userId));
    else {
      return this._handleUserCreatedEvent(userId);
    }
  }

  async syncData(listData: any[]) {
    try {
      const basicToken = createBasicAuthToken('api', this.MAUTIC_API_KEY);
      const response = await axios.post(`${this.MAUTIC_API_URL}/api/contacts/batch/new`, listData, {
        headers: {
          Authorization: basicToken,
          'Content-Type': 'application/json',
        },
      });
      console.log(`${listData.length} items updated to CRM`);
      return response.data;
    } catch (e) {
      // Handle error
      console.error('Error making API request:', e);
      throw new ServiceUnavailableException(new AppError(ERR_MAUTIC));
    }
  }

  private async _handleUserUpdated(user: User, mailingId: number) {
    try {
      const dto = this._getUpdateContactDto(user);
      const contact = await this.updateContact(user.mailingId ?? mailingId, dto as UpdateMauticContactDto);
      // console.log(contact);
    } catch (e) {
      // console.log(e);
    }
  }

  private async _handleUserCreated(user: User) {
    try {
      const dto = this._getUpdateContactDto(user);
      const response = await this.createContact(dto);
      // console.log(response);
    } catch (e) {
      // console.log(e);
    }
  }

  /**
   * Mock implementation for sending ticket notifications via Mautic.
   * In a real environment, this would map to a specific Mautic email template API call.
   */
  async sendTicketNotification(userId: string, ticketId: string, templateData: any) {
    console.log(`[Mautic Mock] Sending email to user ${userId} for ticket ${ticketId}`, templateData);
    // Usually this would fetch user email, and call:
    // await this.apiClient.emails.sendToContact(emailId, contactId, { tokens: templateData })
    return { success: true, message: 'Notification sent' };
  }
}
