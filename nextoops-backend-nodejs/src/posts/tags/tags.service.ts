import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { AppError } from '../../commons/errors/app-error';
import { ERR_NOT_FOUND_TAG } from '../../commons/errors/errors-codes';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { Pagination } from '../../commons/pagination/pagination';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class TagsService {
  @InjectRepository(Tag)
  tagRepo: Repository<Tag>;

  async create(createTagDto: CreateTagDto, i18n: I18nContext) {
    const { name, alias, type, subjectType } = createTagDto;
    const tag = this.tagRepo.create({ name, alias, type, subjectType });
    const saved = await this.tagRepo.save(tag);
    return this.findOne(saved.id, i18n);
  }

  async createMany(createTagDtos: CreateTagDto[], i18n: I18nContext) {
    let list: Tag[] = [];
    for (let dto of createTagDtos) {
      const { name, alias, type, subjectType } = dto;
      const tag = this.tagRepo.create({ name, alias, type, subjectType });
      // const tag = await this.create(createTagDto,i18n);
      list.push(tag);
    }
    const data = await this.tagRepo.save(list);
    return data.map((value) => value.setI18n(i18n));
  }

  async findAll(dto: PaginationDto, i18n: I18nContext) {
    const [data, total] = await this.tagRepo.findAndCount({
      take: dto.take,
      skip: dto.skip,
    });
    const translatedData = data.map((value) => value.setI18n(i18n));
    return new Pagination<Tag>(translatedData, total);
  }

  async findOne(id: string, i18n: I18nContext) {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
    return this._setTagParams(tag, i18n);
  }

  async update(id: string, dto: UpdateTagDto, i18n: I18nContext) {
    const result = await this.tagRepo.update(id, dto);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
    return await this.findOne(id, i18n);
  }

  async remove(id: string) {
    const result = await this.tagRepo.delete(id);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
  }

  private _setTagParams(value: Tag, i18n: I18nContext): Tag {
    value.name = i18n.t(`locale.${value.alias}`, { defaultValue: value.name });
    return value;
  }
}
