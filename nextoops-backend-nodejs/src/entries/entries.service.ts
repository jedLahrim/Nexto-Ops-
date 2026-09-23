import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Entry } from './entities/entry.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { User } from '../user/entities/user.entity';
import { FilterEntryDto } from './dto/filter-entry.dto';
import { Pagination } from 'src/commons/pagination/pagination';
import { EntryCategory } from './entries-categotries/entities/entries-categotry.entity';
import {
  ERR_NOT_FOUND_CONTENT,
  ERR_NOT_FOUND_ENTRY,
  ERR_NOT_FOUND_ENTRY_CATEGORY,
  ERR_NOT_FOUND_USE_CASE,
} from 'src/commons/errors/errors-codes';
import { AppError } from 'src/commons/errors/app-error';
import { ChallengesService } from 'src/challenges/challenges.service';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { ExportDataDto } from '../user/dto/export-data.dto';
import { AttachmentsService } from '../attachments/attachments.service';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { AiService } from '../ai/ai.service';
import { getInsightAIModelByAIProvider, parseJsonResponse, Utils } from '../commons/utils';
import { EmotionState } from './enums/emotion-state.enum';
import { EntryCreatedEvent } from '../event-listeners/events/entry-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntryRemovedEvent } from '../event-listeners/events/entry-removed.event';
import { AttachmentEntry } from '../posts/entities/attachment-entry.entity';
import { CreateChatAIDto } from '../ai/dto/create-chat-a-i.dto';
import { EntryExecutedEvent } from '../event-listeners/events/entry-executed.event';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import * as moment from 'moment/moment';
import { isEmpty } from 'lodash';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry) private readonly entryRepo: Repository<Entry>,
    @InjectRepository(EntryCategory) private readonly entryCategoryRepository: Repository<EntryCategory>,
    @InjectRepository(Attachment) private readonly attachmentsRepo: Repository<Attachment>,
    @InjectRepository(UseCase) private readonly useCaseRepo: Repository<UseCase>,
    @InjectRepository(AttachmentEntry) private readonly attachmentEntryRepo: Repository<AttachmentEntry>,
    private readonly challengesService: ChallengesService,
    private readonly attachmentsService: AttachmentsService,
    private readonly aiService: AiService,
    private eventEmitter: EventEmitter2,
  ) {}

  // async create(dto: CreateEntryDto, me: User) {
  //   const entryCategory = await this.entryCategoryRepository.findOne({ where: { id: dto.entryCategoryId } });
  //   if (!entryCategory) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
  //   const entry = this.entryRepo.create({
  //     userId: me.id,
  //     entryCategoryId: dto.entryCategoryId,
  //     data: dto.data,
  //   });
  //   const saved = await this.entryRepo.save(entry);
  //   await this.challengesService.trackEntryForChallenge(me, saved.entryCategoryId, saved.createdAt);
  //   return this.findOne(saved.id, me);
  // }
  async create(dto: CreateEntryDto, me: User) {
    let {
      entryCategoryId,
      attachments,
      voiceAttachment,
      title,
      content,
      useCaseId,
      randomUseCase,
      emotion,
      data,
      feelings,
      activities,
    } = dto;
    const entryCategory = await this.entryCategoryRepository.findOne({ where: { id: dto.entryCategoryId } });
    if (!entryCategory) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));

    if (voiceAttachment) {
      voiceAttachment = await this.attachmentsService.checkAttachmentExistOrFail(voiceAttachment.id);
      content = voiceAttachment.transcription.trim();
    }

    const entry = this.entryRepo.create({
      userId: me.id,
      entryCategoryId,
      data,
      content,
      title,
      voiceAttachment,
      useCaseId,
      emotion,
      feelings,
      activities,
    });

    const saved = await this.entryRepo.save(entry);

    if (attachments) saved.attachmentsEntry = await this._saveAttachmentsEntry(saved.id, attachments, true);

    // emit event
    const entryCreatedEvent: EntryCreatedEvent = {
      entry: saved,
      isFirstOne: false,
      createdBy: me,
    };

    this.eventEmitter.emit('entry.created', entryCreatedEvent);

    return this.findOne(saved.id, me);
  }

  async executeEntry(entryId: string, useCaseId: string, me: User) {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, userId: me.id },
      relations: { voiceAttachment: true },
    });
    if (!entry) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY));

    const content = (entry.voiceAttachment?.transcription ?? entry.content ?? '').trim();
    if (!content) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CONTENT));

    const lastDaysEntries = await this._fetchLastDaysEntries(me.id, entry.id);

    const useCase = await this.useCaseRepo.findOne({ where: { id: useCaseId } });
    if (!useCase) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));

    const aiProvider = useCase.aiProvider;
    const model = getInsightAIModelByAIProvider(aiProvider);

    const prompt = this.buildIAEntryPrompt(useCase.question, content, lastDaysEntries);

    console.log('Executing Entry Prompt:', prompt);

    // values of EmotionState
    const emotionValues = Object.values(EmotionState).join(', ');

    const createChatOpenAIDto: CreateChatAIDto = {
      userId: me.id,
      model,
      aiProvider,
      jsonSchema: useCase.jsonSchema,
      inputVariables: {
        '@firstName': me.firstName,
      },
      // outputVariables: {
      //   '[Current Date]': Utils.friendlyDate(new Date()),
      //   '[Name of Professional Creating Insight]': user.fullName,
      // },
      // maxResponseLength: 2000,x
    };
    const response = await this.aiService.createChatCompletion(prompt, createChatOpenAIDto);
    const parsed = parseJsonResponse(response);

    entry.title = parsed.title;
    entry.emotion = parsed.emotion;
    entry.overview = (parsed.overview ?? '').trim();
    entry.description = (parsed.description ?? '').trim();
    entry.activities = Array.isArray(parsed.activities)
      ? parsed.activities.map((f: string) => f.trim()).filter(Boolean)
      : null;
    entry.feelings = Array.isArray(parsed.feelings)
      ? parsed.feelings.map((f: string) => f.trim()).filter(Boolean)
      : null;
    entry.useCaseId = useCase.id;

    await this.entryRepo.save(entry);
    const entryExecutedEvent: EntryExecutedEvent = {
      entry,
      createdBy: me,
    };
    this.eventEmitter.emit('entry.executed', entryExecutedEvent);
    return this.findOne(entry.id, me);
  }

  private buildIAEntryPrompt(question: string, content: string, lastEntries?: string[]): string {
    const parts: string[] = [];

    parts.push('Question:');
    parts.push(question);

    if (!isEmpty(lastEntries)) {
      parts.push('---');
      parts.push('Context (user entries from last days, oldest to newest; may help consistency):');
      parts.push(...lastEntries);
    }

    parts.push('---');
    parts.push('User entry:');
    parts.push(content);

    return parts.join('\n');
  }

  private async _fetchLastDaysEntries(userId: string, excludeEntryId: string, fetchDays = 7): Promise<string[]> {
    const end = new Date();
    const start = moment().subtract(fetchDays, 'day').toDate();

    const entries = await this.entryRepo.find({
      where: {
        userId,
        id: Not(excludeEntryId),
        createdAt: Between(start, end),
      },
      order: { createdAt: 'ASC' },
      relations: { voiceAttachment: true },
      take: 40,
    });

    // format e.createdAt into YYYY-MM-DD HH:MM wiht moment
    const formatYMD = (d: Date) => moment(d).format('YYYY-MM-DD HH:mm');
    return entries
      .map((e) => {
        if (!e.text) return null;
        return `${formatYMD(e.createdAt)}: ${e.text}`;
      })
      .filter((v): v is string => v != null);
  }

  //   async executeEntry(entryId: string, useCaseId: string, me: User) {
  //     const entry = await this.entryRepo.findOne({ where: { id: entryId, userId: me.id } });
  //     if (!entry) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY));
  //     console.log(entry);
  //     const entryText = (entry.voiceAttachment?.transcription ?? entry.content ?? '').trim();
  //     if (!entryText) throw new BadRequestException('Entry has no text (no transcription and no content).');
  // console.log(entryText);
  //     const useCase = await this.useCaseRepo.findOne({ where: { id: useCaseId } });
  //     console.log(useCase);
  //     if (!useCase) throw new NotFoundException('UseCase not found');
  //     if (useCase.entryCategoryId && useCase.entryCategoryId !== entry.entryCategoryId) {
  //       throw new BadRequestException('UseCase does not match the entry category.');
  //     }
  //
  //     const prompt = [
  //       `Question: ${useCase.question}`,
  //       `---`,
  //       `User entry text:`,
  //       entryText,
  //       `---`,
  //       `Return JSON exactly like: {"overview":"...","feelings":["...","..."],"description":"..."}`
  //     ].join('\n');
  //
  //     const aiRaw = await this.aiService.createChatCompletion(
  //       `Return ONLY valid JSON with keys: overview (string), feelings (string[]), description (string). No explanations.\n${prompt}`
  //     );
  //
  //     let parsed: { overview?: string; feelings?: string[]; description?: string };
  //     console.log(aiRaw);
  //     try {
  //       const cleaned = String(aiRaw).trim().replace(/^```(json)?/i, '').replace(/```$/, '');
  //       parsed = JSON.parse(cleaned);
  //     } catch {
  //       throw new BadRequestException('AI did not return valid JSON.');
  //     }
  //
  //     entry.overview = (parsed.overview ?? '').trim() || null;
  //     entry.description = (parsed.description ?? '').trim() || null;
  //     entry.feelings = Array.isArray(parsed.feelings)
  //       ? parsed.feelings.map(s => s.trim()).filter(Boolean)
  //       : null;
  //     entry.useCaseId = useCase.id;
  //     entry.useCase = useCase;
  //     await this.entryRepo.save(entry);
  //     return this.findOne(entry.id, me);
  //   }

  async findAll(dto: FilterEntryDto, me: User) {
    this.entryRepo.delete(dto.entryCategoryId);
    const { entryCategoryId, endDate, startDate, include, take, skip, search } = dto;
    const query = this.entryRepo.createQueryBuilder('entry');
    query.where('entry.userId = :id', { id: me.id });
    if (search) {
      query.andWhere(`(LOWER(entry.content) LIKE LOWER(:search))`, {
        search: `%${search}%`,
      });
    }

    if (entryCategoryId) {
      query.leftJoinAndSelect('entry.entryCategory', 'entryCategory');
      query.andWhere('entry.entryCategoryId = :entryCategoryId', { entryCategoryId });
    }

    if (startDate) {
      query.andWhere('entry.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('entry.createdAt <= :endDate', { endDate });
    }

    const allowedRelations: FindOptionsRelations<Entry> = {
      entryCategory: true,
      voiceAttachment: true,
      attachmentsEntry: {
        attachment: true,
      },
    };

    if (include) {
      Utils.queryIncludeV2<Entry>(query, include, allowedRelations);
    }

    query.orderBy('entry.createdAt', 'DESC').take(dto.take).skip(dto.skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination(data, total);
  }

  async findOne(id: string, me: User) {
    const entry = await this.entryRepo.findOne({
      where: { id, userId: me.id },
      relations: {
        entryCategory: true,
        voiceAttachment: true,
        attachmentsEntry: {
          attachment: true,
        },
      },
      order: {
        attachmentsEntry: {
          orderIndex: 'ASC',
        },
      },
    });
    if (!entry) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY));
    return entry;
  }

  async update(id: string, dto: UpdateEntryDto, me: User) {
    const {
      data,
      content,
      title,
      voiceAttachment,
      feelings,
      activities,
      attachments,
      useCaseId,
      emotion,
      entryCategoryId,
    } = dto;
    const result = await this.entryRepo.update(
      { id, userId: me.id },
      {
        data,
        content,
        title,
        voiceAttachment,
        useCaseId,
        emotion,
        entryCategoryId,
        feelings,
        activities,
      },
    );
    if (!result.affected) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY));

    const entry = await this.findOne(id, me);
    if (dto.attachments) entry.attachmentsEntry = await this._saveAttachmentsEntry(entry.id, dto.attachments, true);

    await this.entryRepo.save(entry);
    return this.findOne(entry.id, me);
  }

  async remove(id: string, me: User) {
    const entry = await this.entryRepo.findOne({ where: { id, userId: me.id } });
    if (!entry) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY));

    await this.entryRepo.delete({ id });
    const entryRemovedEvent: EntryRemovedEvent = {
      entry,
      createdBy: me,
      isFirstOne: false,
    };
    this.eventEmitter.emit('entry.removed', entryRemovedEvent);
  }

  async getData(me: User, dto: FilterEntryDto) {
    const pagination = await this.findAll(dto, me);
    const entries = pagination.data;
    // const entries = await this.entryRepo.find({
    //   where: { userId: userId, createdAt: this._filterByDates(dto.startDate, dto.endDate) },
    //   order: {
    //     createdAt: 'ASC',
    //   },
    //   relations: { voiceAttachment: true },
    // });
    return this._formattedEntryData(entries, 'Entries', true);
  }

  private _filterByDates(startDate?: Date, endDate?: Date) {
    if (startDate && endDate) {
      return Between(startDate, endDate);
    } else if (startDate) {
      return MoreThanOrEqual(startDate);
    } else if (endDate) {
      return LessThanOrEqual(endDate);
    }
  }

  private _formattedEntryData(entries: Entry[], title: string, optimizeForAI?: boolean): ExportDataDto {
    const data = entries
      ?.filter((value) => value.description || value.voiceAttachment?.transcription)
      .map((value) => {
        const voiceAttachment = value.voiceAttachment;
        const hasSummary = !!voiceAttachment?.summary;

        const headerData = {};
        headerData[`${title}`] = value.description;

        const bodyData = {};

        if (optimizeForAI) {
          if (hasSummary) {
            bodyData['Summary'] = voiceAttachment?.summary ?? null;
          } else {
            bodyData['Transcription'] = voiceAttachment?.transcription ?? null;
          }
        } else {
          bodyData['Transcription'] = voiceAttachment?.transcription ?? null;
          bodyData['Summary'] = voiceAttachment?.summary ?? null;
        }

        return {
          ...headerData,
          ...bodyData,
        };
      });

    return new ExportDataDto(data);
  }

  private async _saveAttachmentsEntry(entryId: string, attachments: Attachment[], deletePrevious: boolean = false) {
    const foundedAttachments = await this.attachmentsService.checkAttachmentsExist(attachments);

    if (deletePrevious) {
      await this.attachmentEntryRepo.delete({
        entryId,
      });
    }

    const attachmentEntries = this._getAttachmentEntryByAttachments(foundedAttachments, entryId);
    return this.attachmentEntryRepo.save(attachmentEntries);
  }

  _getAttachmentEntryByAttachments(attachments: Attachment[], entryId?: string) {
    const attachmentsEntry: AttachmentEntry[] = [];
    attachments?.forEach((attachment, index) => {
      let attachmentEntry = this.attachmentEntryRepo.create({
        entryId: entryId,
        attachment: attachment,
        orderIndex: index,
      });
      attachmentsEntry.push(attachmentEntry);
    });

    return attachmentsEntry;
  }

  async fetchForUserInRange(userId: string, start: Date, end: Date) {
    return this.entryRepo.find({
      where: { userId, createdAt: Between(start, end) },
      order: { createdAt: 'ASC' },
      relations: { voiceAttachment: true },
      take: 2000,
    });
  }
}
