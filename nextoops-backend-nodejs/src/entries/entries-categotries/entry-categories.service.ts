import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppError } from '../../commons/errors/app-error';
import { ERR_NOT_FOUND_ENTRY_CATEGORY } from '../../commons/errors/errors-codes';
import { Pagination } from '../../commons/pagination/pagination';
import { I18nContext } from 'nestjs-i18n';
import { EntryCategory } from './entities/entries-categotry.entity';
import { CreateEntryCategoryDto } from './dto/create-entries-categotry.dto';
import { UpdateEntriesCategotryDto } from './dto/update-entries-categotry.dto';
import { EntryCategoryOrderBy, FilterEntryCategoryDto } from './dto/filter-entry-category.dto';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import { getSupportedLanguageCode, setUseCaseParams, Utils } from '../../commons/utils';
import { SortType } from '../../commons/enums/sortType';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class EntryCategoriesService {
  @InjectRepository(EntryCategory)
  entryCategoryRepo: Repository<EntryCategory>;

  async create(dto: CreateEntryCategoryDto, me: User, i18n: I18nContext) {
    const { name, alias, imageAttachment, colorType } = dto;
    const entryCategory = this.entryCategoryRepo.create({ name, alias, imageAttachment, colorType });
    const saved = await this.entryCategoryRepo.save(entryCategory);
    return this.findOne(saved.id, me, i18n);
  }

  async findAll(dto: FilterEntryCategoryDto, me: User, i18n: I18nContext) {
    const { include, orderBy, sortType } = dto;
    const contentLanguageCode = getSupportedLanguageCode(i18n?.lang, me.contentLanguageCode);
    const query = this.entryCategoryRepo.createQueryBuilder('entryCategory');
    query.leftJoinAndSelect('entryCategory.imageAttachment', 'imageAttachment');
    const allowedRelations: FindOptionsRelations<EntryCategory> = {
      // useCases: true,
    };

    if (include) {
      Utils.queryIncludeV2<EntryCategory>(query, include, allowedRelations);
    }

    if (include?.includes('useCases')) {
      query.leftJoinAndSelect('entryCategory.useCases', 'useCase');
      query.leftJoinAndSelect('useCase.translations', 'translation');
      query.andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode });
    }

    this._entryCategoriesOrderBy(orderBy, sortType, query);
    query.skip(dto.skip).take(dto.take);
    const [data, total] = await query.getManyAndCount();
    const translatedData = data.map((value) => {
      value.useCases = value.useCases?.map((useCase) => setUseCaseParams(useCase, contentLanguageCode));
      return value.setI18n(i18n);
    });
    return new Pagination<EntryCategory>(translatedData, total);
  }

  private _entryCategoriesOrderBy(
    orderBy: EntryCategoryOrderBy,
    sortType: SortType,
    query: SelectQueryBuilder<EntryCategory>,
  ) {
    switch (orderBy) {
      case EntryCategoryOrderBy.NAME:
        query.orderBy('entryCategory.name', sortType);
        break;
      case EntryCategoryOrderBy.CREATED_AT:
        query.orderBy('entryCategory.createdAt', sortType);
        break;
    }
  }

  async findOne(id: string, me: User, i18n: I18nContext) {
    const entryCategory = await this.entryCategoryRepo.findOne({
      where: { id, useCases: { translations: { languageCode: me.contentLanguageCode } } },
      relations: { useCases: { translations: true }, imageAttachment: true },
    });
    if (!entryCategory) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
    }
    return this._setTagParams(entryCategory, i18n);
  }

  async update(id: string, dto: UpdateEntriesCategotryDto, me: User, i18n: I18nContext) {
    const result = await this.entryCategoryRepo.update(id, dto);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
    }
    return await this.findOne(id, me, i18n);
  }

  async remove(id: string) {
    const result = await this.entryCategoryRepo.delete(id);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ENTRY_CATEGORY));
    }
  }

  private _setTagParams(value: EntryCategory, i18n: I18nContext): EntryCategory {
    value.name = i18n.t(`locale.${value.alias}`, { defaultValue: value.name });
    return value;
  }
}
