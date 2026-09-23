import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAiInsightDto } from './dto/create-ai-insight.dto';
import { UpdateAiInsightDto } from './dto/update-ai-insight.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AiInsight } from './entities/ai-insight.entity';
import { User } from '../../../user/entities/user.entity';
import { AiInsightOrderBy, FilterAiInsightDto } from './dto/filter-ai-insight.dto';
import { Pagination } from '../../../commons/pagination/pagination';
import { SortType } from '../../../commons/enums/sortType';
import { AppError } from '../../../commons/errors/app-error';
import {
  ERR_EXPORT_DOCUMENT,
  ERR_NOT_FOUND_AI_INSIGHTS,
  ERR_UNAUTHORIZED_SHARE_AI_INSIGHT,
} from '../../../commons/errors/errors-codes';
import { ModifyAiInsightDto } from './dto/modify-ai-insight.dto';
import { AiInsightActions } from './enum/ai-insight-actions.enum';
import { AiService } from '../../ai.service';
import { ShareService } from '../../../share/share.service';
import { Constant } from '../../../commons/constant';
import { PermissionService } from '../../../permission/permission.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { NotificationType } from '../../../notifications/enum/notification-type.enum';
import { PushNotificationDto } from '../../../notifications/dto/push-notification.dto';
import { NotificationsService } from '../../../notifications/notifications.service';
import { NotificationContentDto } from '../../../notifications/dto/notification-content.dto';
import { InsightCreatedEvent } from '../../../event-listeners/events/insight-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { getBufferFromUrl, getFileNameByType, Utils } from '../../../commons/utils';
import { ExportAiInsightDto } from './dto/export-ai-insight.dto';
import * as excel from 'exceljs';
import { ExportType } from '../../../exports/export-data/enum/export-type.enum';
import { startCase } from 'lodash';
import { GradientBgType } from '../../../entries/entries-categotries/enums/gradient-type.enum';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class AiInsightsService {
  constructor(
    @InjectRepository(AiInsight)
    private aiInsightRepo: Repository<AiInsight>,
    private aiService: AiService,
    private shareService: ShareService,
    private permissionService: PermissionService,
    private notificationsService: NotificationsService,
    private readonly i18nService: I18nService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateAiInsightDto, user: User) {
    const {
      question,
      shortText,
      description,
      output,
      metaData,
      answer,
      timeFrame,
      timeFrameStartDate,
      timeFrameEndDate,
      rate,
      colorType,
    } = dto;

    const aiInsight = this.aiInsightRepo.create({
      question: question,
      answer: answer,
      output: output,
      shortText,
      description,
      user: { id: user.id },
      metaData,
      timeFrame,
      timeFrameStartDate,
      timeFrameEndDate,
      rate,
      colorType: colorType ?? Utils.getRandomEnumValue<GradientBgType>(GradientBgType),
    });

    const saved = await this.aiInsightRepo.save(aiInsight);

    const insight = await this.findOneOrFail(saved.id, { useCase: true });

    const insightCreatedEvent: InsightCreatedEvent = {
      createdBy: user,
      insight,
    };
    this.eventEmitter.emit('insight.created', insightCreatedEvent);

    return insight;
  }

  async findAll(filterDto: FilterAiInsightDto, user: User) {
    const { take, skip, orderBy, sortType, timeFrame } = filterDto;

    const query = this.aiInsightRepo.createQueryBuilder('aiInsight');
    query.andWhere('aiInsight.userId= :userId ', { userId: user.id });

    if (timeFrame) {
      query.andWhere('aiInsight.timeFrame= :timeFrame', { timeFrame });
    }

    this._aiInsightOrderBy(orderBy, sortType, query);
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<AiInsight>(data, total);
  }

  async findOneOrFail(id: string, relations?: FindOptionsRelations<AiInsight>) {
    const aiInsight = await this.aiInsightRepo.findOne({
      where: { id: id },
      relations: relations,
    });
    if (!aiInsight) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_AI_INSIGHTS));
    }
    return aiInsight;
  }

  async update(id: string, updateAiInsightDto: UpdateAiInsightDto) {
    const {
      output,
      question,
      shortText,
      description,
      metaData,
      answer,
      timeFrame,
      timeFrameStartDate,
      timeFrameEndDate,
      rate,
      colorType,
    } = updateAiInsightDto;
    const updateResult = await this.aiInsightRepo.update(id, {
      answer: answer,
      output: output,
      question: question,
      shortText,
      description,
      metaData,
      timeFrame,
      timeFrameStartDate,
      timeFrameEndDate,
      rate,
      colorType,
    });

    if (!updateResult || updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_AI_INSIGHTS));
    }
    return this.findOneOrFail(id);
  }

  async remove(id: string) {
    const deleteResult = await this.aiInsightRepo.delete(id);
    if (!deleteResult || deleteResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_AI_INSIGHTS));
    }
  }

  // change AI response based on action SHORTER, LONGER or REGENERATE
  async modify(id: string, modifyAiInsightDto: ModifyAiInsightDto, user: User) {
    const { iInsightActions } = modifyAiInsightDto;
    const aiInsight = await this.findOneOrFail(id);
    switch (iInsightActions) {
      case AiInsightActions.SHORTER:
        const shorterAnswer = await this.aiService.createChatCompletion(
          Constant.SHORTER_CONTENT(aiInsight.output.insight),
        );
        if (aiInsight.output) aiInsight.output.insight = shorterAnswer;

        return this.create(
          {
            ...aiInsight,
            answer: shorterAnswer,
            output: aiInsight.output,
          },
          user,
        );
      case AiInsightActions.LONGER:
        const longerAnswer = await this.aiService.createChatCompletion(Constant.LONGER_CONTENT(aiInsight.question));
        return this.create(
          {
            ...aiInsight,
            answer: longerAnswer,
          },
          user,
        );
      case AiInsightActions.REGENERATE:
        const regeneratedAnswer = await this.aiService.createChatCompletion(
          Constant.REGENERATED_CONTENT(aiInsight.answer),
        );
        if (aiInsight.output) aiInsight.output.insight = regeneratedAnswer;
        return this.create(
          {
            ...aiInsight,
            answer: regeneratedAnswer,
            output: aiInsight.output,
          },
          user,
        );
    }
  }

  async share(id: string, user: User) {
    const aiInsight = await this.findOneOrFail(id);
    // only the owner of that aiInsight object can share it
    if (aiInsight.userId !== user.id) throw new UnauthorizedException(new AppError(ERR_UNAUTHORIZED_SHARE_AI_INSIGHT));
    const path = `insight?id=${aiInsight.id}`;
    return this.shareService.createShareLink(path, Constant.APP_ICON);
  }

  async notify(id: string, i18n: I18nContext) {
    const aiInsight = await this.aiInsightRepo.findOne({ where: { id }, relations: { user: true } });
    const memberId = aiInsight.userId;
    return this.notifyByUserId(aiInsight, memberId, aiInsight.user, i18n);
  }

  async notifyByUserId(aiInsight: AiInsight, userId: string, user: User, i18n?: I18nContext) {
    // const aiInsight = await this.findOneOrFail(id);
    const locale = i18n ?? this.i18nService;
    const type = NotificationType.INSIGHT_GENERATED;
    const name = startCase(user.fullName);
    const pushNotificationDto: PushNotificationDto = {
      notification: {
        title: locale.t('locale.notification_title_generate_new_ai_insight', {
          args: { firsname: name },
        }),
        body: locale.t('locale.notification_body_generate_new_ai_insight', {
          args: {
            title: aiInsight.description,
          },
        }),
      },
      data: {
        content: new NotificationContentDto({
          payload: {
            notificationType: type,
            insightId: aiInsight.id,
          },
        }),
      },
      userId: userId,
      type: type,
    };

    await this.notificationsService.pushNotification(pushNotificationDto, true);
  }

  async sendMail(id: string, me: User) {
    const insight = await this.findOneOrFail(id, { useCase: true });

    const insightCreatedEvent: InsightCreatedEvent = {
      createdBy: me,
      insight,
    };
    this.eventEmitter.emit('insight.created', insightCreatedEvent);
  }

  async generatePDF(insight: AiInsight): Promise<Buffer> {
    const inputText = this.i18nService
      .t('locale.insight_template', {
        args: {
          content: insight.output,
        },
      })
      .replace(/\*\*/g, '');
    const pdfBuffer: Buffer = await new Promise(async (resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        bufferPages: true,
      });

      // Register fonts
      doc.registerFont(
        'Urbanist-Regular',
        fs.readFileSync(path.join(__dirname, '../../../assets/fonts/Urbanist-Regular.ttf')), // Replace with the correct
        // path to your font file
      );
      doc.registerFont(
        'Urbanist-Bold',
        fs.readFileSync(path.join(__dirname, '../../../assets/fonts/Urbanist-Bold.ttf')), // Replace with the correct
        // path to your font file
      );

      // Add Image Logo
      const imageLogo = await getBufferFromUrl(Constant.APP_ICON_MAILING);
      const imageKit = doc.image(imageLogo, 60, 42, {
        height: 40,
        link: Constant.WEBSITE,
      });

      // doc.moveTo(doc.x, imageKit.y + 42);
      // Add Insight Title
      doc
        .font('Urbanist-Bold')
        .fontSize(16)
        .fillColor('#40C8F1')
        .text(insight.useCase.shortText ?? 'Insight', doc.x, imageKit.y + 42);
      doc.moveDown(1);
      doc.font('Urbanist-Regular').fillColor('#192252').fontSize(12).text(insight.description);
      doc.moveDown(2);

      // Add Insight
      doc.font('Urbanist-Regular').fillColor('#848FAC').fontSize(14).text(inputText);

      doc.end();

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });

    return pdfBuffer;
  }

  async export(id: string, dto: ExportAiInsightDto, res: Response, me: User, i18n: I18nContext) {
    const { exportType } = dto;
    const insight = await this.findOneOrFail(id, { useCase: true });
    const fileName = insight.useCase?.shortText ?? 'insight';
    try {
      switch (exportType) {
        case ExportType.PDF:
          const buffer = await this.generatePDF(insight);
          return this._downloadPdfFile(res, getFileNameByType(ExportType.PDF, fileName), buffer);
        case ExportType.CSV:
          break;
        case ExportType.EXCEL:
          break;
      }
    } catch (e) {
      throw new BadRequestException(new AppError(ERR_EXPORT_DOCUMENT));
    }
  }

  private _aiInsightOrderBy(orderBy: AiInsightOrderBy, sortType: SortType, query: SelectQueryBuilder<AiInsight>) {
    switch (orderBy) {
      case AiInsightOrderBy.UPDATED_AT:
        query.orderBy('aiInsight.updatedAt', sortType);
        break;
      case AiInsightOrderBy.CREATED_AT:
        query.orderBy('aiInsight.createdAt', sortType);
        break;
    }
  }

  private _downloadPdfFile(res: Response, filename: string, buffer: Buffer) {
    res.attachment(filename);
    res.contentType('application/pdf');
    res.send(buffer);
  }

  private _downloadExcelFile(res: Response, filename: string, buffer: excel.Buffer) {
    res.attachment(filename);
    res.contentType('application/xlsx');
    res.send(buffer);
  }

  rate(id: string, me: User, i18n: I18nContext) {}
}
