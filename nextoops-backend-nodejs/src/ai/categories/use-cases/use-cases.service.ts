import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUseCaseDto } from './dto/create-use-case.dto';
import { UpdateUseCaseDto } from './dto/update-use-case.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UseCase } from './entities/use-case.entity';
import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { AppError } from '../../../commons/errors/app-error';
import { ERR_NOT_FOUND_USE_CASE, ERR_USE_CASE_TRANSLATION_ALREADY_EXIST } from '../../../commons/errors/errors-codes';
import { FilterUseCaseDto, UseCaseOrderBy } from './dto/filter-use-case.dto';
import { Pagination } from '../../../commons/pagination/pagination';
import { SortType } from '../../../commons/enums/sortType';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import { getSupportedLanguageCode, setUseCaseParams, Utils } from '../../../commons/utils';
import { ExecuteUseCaseDto } from './dto/execute-use-case.dto';
import { ExportDataDto } from '../../../user/dto/export-data.dto';
import { UseCaseTranslation } from './entities/use-case-translation.entity';
import { CreateUseCaseTranslationDto } from './dto/create-use-case-translation.dto';
import { UpdateUseCaseTranslationDto } from './dto/update-use-case-translation.dto';
import { rethrow } from '@nestjs/core/helpers/rethrow';
import { User } from '../../../user/entities/user.entity';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class UseCasesService {
  constructor(
    @InjectRepository(UseCase)
    private useCaseRepo: Repository<UseCase>,
    @InjectRepository(UseCaseTranslation)
    private useCaseTranslationRepo: Repository<UseCaseTranslation>,
  ) {}

  async create(dto: CreateUseCaseDto) {
    const {
      question,
      shortText,
      description,
      categoryId,
      entryCategoryId,
      metaData,
      requiredTrackingCount,
      defaultInsight,
      jsonSchema,
      length,
      extraData,
      translations,
    } = dto;
    const useCase = this.useCaseRepo.create({
      question,
      shortText,
      description,
      metaData,
      useCaseCategoryId: categoryId,
      requiredTrackingCount,
      entryCategoryId,
      defaultInsight,
      jsonSchema,
      extraData,
      length,
    });
    const saved = await this.useCaseRepo.save(useCase);
    if (translations) {
      saved.translations = await this.saveUseCaseTranslation(translations, saved.id, true);
    }
    return saved;
  }

  async findAll(dto: FilterUseCaseDto, me: User, i18n?: I18nContext) {
    const { take, skip, categoryId, orderBy, sortType, include, entryCategoryId, length } = dto;
    const contentLanguageCode = getSupportedLanguageCode(i18n?.lang, me.contentLanguageCode);

    const query = this.useCaseRepo.createQueryBuilder('useCase');

    query.leftJoinAndSelect('useCase.translations', 'translation');
    query.andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode });

    if (categoryId) {
      query.andWhere('useCase.useCaseCategoryId=:categoryId', { categoryId });
    }

    if (entryCategoryId) {
      query.andWhere('useCase.entryCategoryId=:entryCategoryId', { entryCategoryId });
    }

    if (length) {
      query.andWhere('useCase.length=:length', { length });
    }

    const allowedRelations: FindOptionsRelations<UseCase> = {
      useCaseCategory: true,
      entryCategory: true,
    };

    if (include) {
      Utils.queryIncludeV2<UseCase>(query, include, allowedRelations);
    }

    if (orderBy) {
      this._useCaseOrderBy(query, orderBy, sortType);
    }
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();

    const translatedData: UseCase[] = data.map((useCase) => {
      return setUseCaseParams(useCase, contentLanguageCode);
    });

    return new Pagination<UseCase>(translatedData, total);
  }

  async findOneOrFail(id: string, user: User, i18n?: I18nContext, relations?: FindOptionsRelations<UseCase>) {
    const languageCode = getSupportedLanguageCode(i18n?.lang, user.languageCode);
    const useCase = await this.useCaseRepo.findOne({
      where: { id: id },
      relations: relations ?? { useCaseCategory: true, entryCategory: true, translations: true },
    });
    if (!useCase) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));
    setUseCaseParams(useCase, languageCode);
    return useCase;
  }

  async update(id: string, dto: UpdateUseCaseDto, user?: User, i18n?: I18nContext) {
    const {
      question,
      shortText,
      description,
      metaData,
      entryCategoryId,
      requiredTrackingCount,
      defaultInsight,
      jsonSchema,
      length,
      extraData,
      translations,
    } = dto;
    const updateResult = await this.useCaseRepo.update(id, {
      question,
      shortText,
      description,
      metaData,
      requiredTrackingCount,
      entryCategoryId,
      defaultInsight,
      jsonSchema,
      extraData,
      length,
    });
    if (updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));
    }

    const useCase = await this.findOneOrFail(id, user, i18n, { translations: true });

    if (translations) {
      useCase.translations = await this.saveUseCaseTranslation(translations, useCase.id, true);
    }

    await this.useCaseRepo.save(useCase);
    return this.findOneOrFail(useCase.id, user, i18n);
  }

  async remove(id: string) {
    const deleteResult = await this.useCaseRepo.delete(id);
    if (!deleteResult || deleteResult.affected == 0) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));
  }

  async archive(id: string) {
    const softDeleteResult = await this.useCaseRepo.softDelete(id);
    if (!softDeleteResult || softDeleteResult.affected == 0)
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));
  }

  getUserDataPrompt(question: string, dto: ExecuteUseCaseDto, exportDataDtos: ExportDataDto[]) {
    let value = '';
    for (const exportDataDto of exportDataDtos) {
      const dataString = this.formattedKeyValue(exportDataDto.data);
      value += `
      - ${exportDataDto.title}
      
      ${dataString}
      `;
    }
    return `${question}: \n\n${value}`;
  }

  private _useCaseOrderBy(query: SelectQueryBuilder<UseCase>, orderBy: UseCaseOrderBy, sortType: SortType) {
    switch (orderBy) {
      case UseCaseOrderBy.CREATED_AT:
        query.orderBy('useCase.createdAt', sortType);
        break;
      case UseCaseOrderBy.UPDATED_AT:
        query.orderBy('useCase.updatedAt', sortType);
        break;
      case UseCaseOrderBy.TEXT:
        query.orderBy('useCase.text', sortType);
        break;
    }
  }

  private formattedKeyValue(records: Record<any, any>[]) {
    return records
      ?.map((record) => {
        return (
          Object.entries(record)
            // todo Filter out key-value pairs where value is null
            .filter(([key, value]) => value !== null)
            .map(([key, value]) => {
              return `${key}: ${value}`;
            })
            .join('\n')
        );
      })
      ?.join('\n\n');
  }

  async saveUseCaseTranslation(
    dtos: CreateUseCaseTranslationDto[],
    id: string,
    deletePrevious?: boolean,
    queryRunner?: QueryRunner,
  ) {
    if (deletePrevious) {
      queryRunner
        ? await queryRunner.manager.delete(UseCaseTranslation, {
            baseId: id,
          })
        : await this.useCaseTranslationRepo.delete({ baseId: id });
    }
    const useCaseTranslations = dtos.map((value) => {
      return this.useCaseTranslationRepo.create({
        shortText: value.shortText,
        baseId: id,
        languageCode: value.languageCode,
      });
    });

    return queryRunner
      ? await queryRunner.manager.save(useCaseTranslations)
      : await this.useCaseTranslationRepo.save(useCaseTranslations);
  }

  async createTranslation(id: string, dto: CreateUseCaseTranslationDto, user: User) {
    const { shortText,languageCode } = dto;

    let useCaseTranslation = this.useCaseTranslationRepo.create({
      shortText,
      languageCode,
      baseId: id,
    });

    try {
      useCaseTranslation = await this.useCaseTranslationRepo.save(useCaseTranslation);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          new AppError(ERR_USE_CASE_TRANSLATION_ALREADY_EXIST, { useCaseId: id, languageCode }),
        );
      }
      rethrow(e);
    }

    return this.findOneTranslation(useCaseTranslation.id, user);
  }

  async updateTranslation(useCaseTranslationId: string, dto: UpdateUseCaseTranslationDto, user: User) {
    const { shortText,  languageCode } = dto;
    const result = await this.useCaseTranslationRepo.update(
      { id: useCaseTranslationId },
      {
        shortText,
        languageCode,
      },
    );
    if (result.affected == null || result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));
    }
    const useCaseTranslation = await this.findOneTranslation(useCaseTranslationId, user);

    return this.findOneTranslation(useCaseTranslation.id, user);
  }

  async findOneTranslation(id: string, user: User) {
    const useCaseTranslation = await this.useCaseTranslationRepo.findOne({
      where: { id },
    });
    if (!useCaseTranslation) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USE_CASE));

    return useCaseTranslation;
  }
}
