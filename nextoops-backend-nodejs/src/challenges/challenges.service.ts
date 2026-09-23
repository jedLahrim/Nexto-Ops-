import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntryCategory } from 'src/entries/entries-categotries/entities/entries-categotry.entity';
import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { User } from 'src/user/entities/user.entity';
import { AppError } from 'src/commons/errors/app-error';
import {
  ERR_CHALLENGE_TRANSLATION_ALREADY_EXIST,
  ERR_FAILED_UPDATE_USER_CHALLENGE_TRACKING,
  ERR_NOT_FOUND_CHALLENGE,
  ERR_NOT_FOUND_CHALLENGE_FOR_USER,
  ERR_NOT_FOUND_ENTRY_CATEGORY,
  ERR_NOT_FOUND_USER,
} from 'src/commons/errors/errors-codes';
import { ChallengeOrderBy, FilterChallengeDto } from './dto/filter-challenge.dto';
import { Pagination } from 'src/commons/pagination/pagination';
import { I18nContext } from 'nestjs-i18n';
import { ChallengeStatus, UserChallenge } from './entities/user-challenge.entity';
import { Entry } from 'src/entries/entities/entry.entity';
import { getSupportedLanguageCode, setChallengeParams } from 'src/commons/utils';
import { ChallengeTranslation } from './entities/challenge-translation.entity';
import { SortType } from 'src/commons/enums/sortType';
import { rethrow } from '@nestjs/core/helpers/rethrow';
import { UpdateChallengeTranslationDto } from './dto/update-challenge-translation.dto';
import { CreateChallengeTranslationDto } from './dto/create-challenge-translation.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChallengeCompletedEvent } from '../event-listeners/events/challenge-completed.event';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(EntryCategory)
    private readonly entryCategoryRepo: Repository<EntryCategory>,
    @InjectRepository(UserChallenge)
    private readonly userChallengeRepo: Repository<UserChallenge>,
    @InjectRepository(Entry) private readonly entryRepo: Repository<Entry>,
    @InjectRepository(ChallengeTranslation)
    private challengeTranslationRepo: Repository<ChallengeTranslation>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateChallengeDto, me: User, i18n: I18nContext) {
    const {
      name,
      alias,
      entryCategoryId,
      challengeDifficulty,
      duration,
      participantsCount,
      photoAttachment,
      translations,
      colorType,
      useCaseId,
    } = dto;
    const entryCategory = await this.entryCategoryRepo.findOne({ where: { id: entryCategoryId } });
    if (!entryCategory) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
    }

    const challenge = this.challengeRepo.create({
      name,
      alias,
      entryCategoryId,
      challengeDifficulty,
      duration,
      participantsCount,
      photoAttachment,
      colorType,
      useCaseId,
    });

    const saved = await this.challengeRepo.save(challenge);
    if (translations) {
      saved.translations = await this.saveChallengeTranslation(translations, saved.id, true);
    }

    return this.findOne(saved.id, me, i18n);
  }

  async findAll(dto: FilterChallengeDto, me: User, i18n: I18nContext): Promise<Pagination<Challenge>> {
    const { search, entryCategoryId, challengeDifficulty, includeAllTranslations } = dto;

    const contentLanguageCode = getSupportedLanguageCode(i18n?.lang, me.contentLanguageCode);

    const query = this.challengeRepo.createQueryBuilder('challenge');

    query.leftJoinAndSelect('challenge.photoAttachment', 'photoAttachment');
    query.leftJoinAndSelect('challenge.translations', 'translation');
    query.andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode });

    // if (includeAllTranslations) {
    //   query.andWhere((qb) => {
    //     const subQuery = qb
    //       .subQuery()
    //       .from(ChallengeTranslationEntity, 'translation')
    //       .where('translation.baseId = challenge.id')
    //       .andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode })
    //       .getQuery();
    //     return `EXISTS ${subQuery}`;
    //   });
    // } else {
    //   query.andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode });
    // }

    if (challengeDifficulty) {
      query.andWhere('challenge.challengeDifficulty = :challengeDifficulty', { challengeDifficulty });
    }
    if (search && search.trim()) {
      query.andWhere('LOWER(challenge.name) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (entryCategoryId) {
      query
        .leftJoinAndSelect('challenge.entryCategory', 'entryCategory')
        .andWhere('challenge.entryCategoryId = :entryCategoryId', { entryCategoryId });
    }

    query.leftJoinAndSelect('challenge.userChallenges', 'userChallenge');

    if (dto.orderBy) this._challengeOrderBy(query, dto.orderBy, dto.sortType);

    query.take(dto.take);
    query.skip(dto.skip);

    const [data, total] = await query.getManyAndCount();

    const translatedData: Challenge[] = data.map((challenge) => {
      const found = challenge.userChallenges?.find((value) => value.userId == me?.id);
      return setChallengeParams(challenge, contentLanguageCode, found, me);
    });

    return new Pagination<Challenge>(translatedData, total);
  }

  async update(id: string, dto: UpdateChallengeDto, me: User, i18n: I18nContext): Promise<Challenge> {
    const {
      name,
      alias,
      entryCategoryId,
      challengeDifficulty,
      duration,
      participantsCount,
      photoAttachment,
      translations,
      colorType,
      useCaseId,
    } = dto;
    const updateResult = await this.challengeRepo.update(
      { id },
      {
        name,
        alias,
        entryCategoryId,
        challengeDifficulty,
        duration,
        participantsCount,
        photoAttachment,
        colorType,
        useCaseId,
      },
    );
    if (!updateResult.affected) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));

    const challenge = await this.findOne(id, me, i18n);
    if (dto.entryCategoryId) {
      const entryCategory = await this.entryCategoryRepo.findOne({ where: { id: dto.entryCategoryId } });
      if (!entryCategory) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
      challenge.entryCategoryId = dto.entryCategoryId;
    }

    if (translations) challenge.translations = await this.saveChallengeTranslation(translations, challenge.id, true);

    await this.challengeRepo.save(challenge);
    return this.findOne(challenge.id, me, i18n);
  }

  async saveChallengeTranslation(
    dtos: CreateChallengeTranslationDto[],
    id: string,
    deletePrevious?: boolean,
    queryRunner?: QueryRunner,
  ) {
    if (deletePrevious) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      queryRunner
        ? await queryRunner.manager.delete(ChallengeTranslation, {
            baseId: id,
          })
        : await this.challengeTranslationRepo.delete({ baseId: id });
    }
    const challengeTranslations = dtos.map((value) => {
      return this.challengeTranslationRepo.create({
        title: value.title,
        baseId: id,
        languageCode: value.languageCode,
        description: value.description,
        whatToExpect: value.whatToExpect,
      });
    });

    return queryRunner
      ? await queryRunner.manager.save(challengeTranslations)
      : await this.challengeTranslationRepo.save(challengeTranslations);
  }

  async createTranslation(id: string, dto: CreateChallengeTranslationDto, i18n: I18nContext, me: User) {
    const { title, description, whatToExpect, languageCode } = dto;

    let challengeTranslation = this.challengeTranslationRepo.create({
      title,
      description,
      whatToExpect,
      languageCode,
      baseId: id,
    });

    try {
      challengeTranslation = await this.challengeTranslationRepo.save(challengeTranslation);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          new AppError(ERR_CHALLENGE_TRANSLATION_ALREADY_EXIST, { challengeId: id, languageCode }),
        );
      }
      rethrow(e);
    }

    return this.findOneTranslation(challengeTranslation.id, me);
  }

  async updateTranslation(
    challengeTranslationId: string,
    dto: UpdateChallengeTranslationDto,
    me: User,
    i18n: I18nContext,
  ) {
    const { title, description, whatToExpect, languageCode } = dto;
    const result = await this.challengeTranslationRepo.update(
      { id: challengeTranslationId },
      {
        title,
        description,
        whatToExpect,
        languageCode,
      },
    );
    if (result.affected == null || result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));
    }
    const challengeTranslation = await this.findOneTranslation(challengeTranslationId, me);

    return this.findOneTranslation(challengeTranslation.id, me);
  }

  async findOneTranslation(id: string, user: User) {
    const challengeTranslation = await this.challengeTranslationRepo.findOne({
      where: { id },
    });
    if (!challengeTranslation) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));

    return challengeTranslation;
  }

  async findOne(id: string, me: User, i18n: I18nContext): Promise<Challenge> {
    const languageCode = getSupportedLanguageCode(i18n?.lang, me.languageCode);
    const challenge = await this.challengeRepo.findOne({
      where: { id },
      relations: {
        entryCategory: true,
        translations: true,
        photoAttachment: true,
        userChallenges: true,
      },
    });
    if (!challenge) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));
    } else {
      const found = challenge.userChallenges.find((value) => value.userId == me?.id);
      setChallengeParams(challenge, languageCode, found, me);
      return challenge;
    }
  }

  async remove(id: string) {
    const result = await this.challengeRepo.softDelete(id);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));
    }
  }

  async startChallenge(challengeId: string, me: User, i18n: I18nContext) {
    // if (!me?.id) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));

    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE));

    const exists = await this.userChallengeRepo.findOne({ where: { userId: me.id, challengeId } });

    if (!exists) {
      const userChallenge = this.userChallengeRepo.create({
        userId: me.id,
        challengeId,
        startAt: new Date(),
        trackedEntryCount: 0,
        trackedEntryDays: 0,
        status: ChallengeStatus.IN_PROGRESS,
      });
      await this.userChallengeRepo.save(userChallenge);
    }

    return this.findOne(challengeId, me, i18n);
  }

  async endChallenge(challengeId: string, me: User, i18n: I18nContext) {
    const res = await this.userChallengeRepo.delete({ userId: me.id, challengeId });
    if (!res.affected) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CHALLENGE_FOR_USER));
    }
    return this.findOne(challengeId, me, i18n);
  }

  async trackEntryForChallenge(me: User, entryCategoryId: string, entryCreatedAt: Date): Promise<void> {
    if (!me.id) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    if (!entryCategoryId) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));

    const challenge = await this.challengeRepo.findOne({
      where: { entryCategoryId },
    });

    if (!challenge) return;

    let userChallenge = await this.userChallengeRepo.findOne({
      where: { userId: me.id, challengeId: challenge.id },
    });

    if (!userChallenge) return;

    userChallenge.trackedEntryCount = (userChallenge.trackedEntryCount ?? 0) + 1;

    const raw = await this.entryRepo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT DATE(e.createdAt))', 'dayCount')
      .where('e.userId = :userId', { userId: me.id })
      .andWhere('e.entryCategoryId = :entryCategoryId', { entryCategoryId })
      .andWhere('e.createdAt >= :startAt', { startAt: userChallenge.startAt })
      .getRawOne<{ dayCount: string }>();

    userChallenge.trackedEntryDays = Number(raw?.dayCount ?? 0);

    try {
      const trackedDaysCompleted = challenge.duration == userChallenge.trackedEntryDays;

      if (trackedDaysCompleted && userChallenge.status != ChallengeStatus.COMPLETED) {
        userChallenge.status = ChallengeStatus.COMPLETED;
        // generate insight but only based from userChallenge.startAt until now and only based on entries with this challenge's entryCategoryId
        this._handleCompletedChallenge(challenge, userChallenge, me);
      }
      await this.userChallengeRepo.save(userChallenge);
    } catch {
      throw new InternalServerErrorException(new AppError(ERR_FAILED_UPDATE_USER_CHALLENGE_TRACKING));
    }
  }

  private _challengeOrderBy(query: SelectQueryBuilder<Challenge>, orderBy: ChallengeOrderBy, sortType: SortType) {
    switch (orderBy) {
      case ChallengeOrderBy.UPDATED_AT:
        query.addOrderBy(`${query.alias}.updatedAt`, sortType);
        break;
      case ChallengeOrderBy.CREATED_AT:
        query.addOrderBy(`${query.alias}.createdAt`, sortType);
        break;
    }
  }

  private _handleCompletedChallenge(challenge: Challenge, userChallenge: UserChallenge, me: User) {
    const event: ChallengeCompletedEvent = { user: me, userChallenge, challenge };
    this.eventEmitter.emit('challenge.completed', event);
  }
}

function andWhere(arg0: string, arg1: { entryCategoryId: string }) {
  throw new Error('Function not implemented.');
}
