import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AppError } from '../../commons/errors/app-error';
import { DUPLICATE_ENTRY, ERR_NOT_FOUND_CATEGORY } from '../../commons/errors/errors-codes';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryOrderBy, FilterCategoryDto } from './dto/filter-category.dto';
import { Pagination } from '../../commons/pagination/pagination';
import { Category, CategoryBasedOn } from './entities/category.entity';
import { AttachmentsService } from '../../attachments/attachments.service';
import { rethrow } from '@nestjs/core/helpers/rethrow';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  alias = 'category';

  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private attachmentsService: AttachmentsService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, i18n: I18nContext) {
    const { name, description, imageAttachment, alias, key, basedOn, trimester, subjectType } = createCategoryDto;

    if (imageAttachment) await this.attachmentsService.checkAttachmentExistOrFail(imageAttachment.id);

    const category = this.categoryRepo.create({
      name,
      description,
      imageAttachment,
      alias,
      key,
      basedOn,
      trimester,
      subjectType,
    });
    try {
      const saved = await this.categoryRepo.save(category);
      return this.findOne(saved.id, i18n);
    } catch (e) {
      // check if already exist key
      if (e.code === DUPLICATE_ENTRY) throw new ConflictException(new AppError(DUPLICATE_ENTRY));
      rethrow(e);
    }
  }

  async findAll(dto: FilterCategoryDto, i18n: I18nContext): Promise<Pagination<Category>> {
    let { take, skip, orderBy, sortType, week, trimester, subjectType } = dto;

    const query = this.categoryRepo.createQueryBuilder('category');

    // fetch categories if send week then only with week trimester should appear
    if (trimester) {
      query.andWhere(
        () => `CASE
          WHEN (category.basedOn = :basedOn) AND (category.trimester IS NOT NULL)
              THEN category.trimester = :trimester
          ELSE 1=1 
          END
      `,
        {
          trimester,
          basedOn: CategoryBasedOn.PREGNANCY_TRIMESTER,
        },
      );
    }

    if (subjectType) {
      query.andWhere('category.subjectType = :subjectType', { subjectType });
    }

    switch (orderBy) {
      case CategoryOrderBy.CREATED_AT:
        query.orderBy('category.createdAt', sortType);
        break;
      case CategoryOrderBy.NAME:
        query.orderBy('category.name', sortType);
        break;
    }
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    const translatedData = data.map((category) => category.setI18n(i18n));
    return new Pagination<Category>(translatedData, total);
  }

  async findOne(id: string, i18n: I18nContext): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id: id },
    });
    if (!category) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    } else {
      return category.setI18n(i18n);
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, i18n: I18nContext): Promise<Category> {
    const { name, description, imageAttachment, alias, key, basedOn, trimester, subjectType } = updateCategoryDto;
    if (imageAttachment) await this.attachmentsService.checkAttachmentExistOrFail(imageAttachment.id);
    const result = await this.categoryRepo.update(
      { id: id },
      {
        name,
        description,
        imageAttachment,
        alias,
        key,
        basedOn,
        trimester,
        subjectType,
      },
    );
    if (result.affected == null || result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    }
    return await this.findOne(id, i18n);
  }

  async remove(id: string) {
    const result = await this.categoryRepo.softDelete({ id });
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    }
  }
}
