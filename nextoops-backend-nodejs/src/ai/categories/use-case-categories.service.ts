import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUseCaseCategoryDto } from './dto/create-use-case-category.dto';
import { UpdateUseCaseCategoryDto } from './dto/update-use-case-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UseCaseCategory } from './entities/usecase-category.entity';
import { AppError } from '../../commons/errors/app-error';
import { ERR_NOT_FOUND_CATEGORY } from '../../commons/errors/errors-codes';
import { CategoryOrder, FilterInsightCategoryDto } from './dto/filter-insight-category.dto';
import { Pagination } from '../../commons/pagination/pagination';
import { SortType } from '../../commons/enums/sortType';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import { Utils } from '../../commons/utils';
import { UserPermissionsType } from '../../user/enums/user-permission.enum';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class UseCaseCategoriesService {
  constructor(
    @InjectRepository(UseCaseCategory)
    private useCaseCategoryRepo: Repository<UseCaseCategory>,
  ) {}

  async create(createCategoryDto: CreateUseCaseCategoryDto) {
    const { name, isSandbox } = createCategoryDto;
    const category = this.useCaseCategoryRepo.create({ name, isSandbox });
    return this.useCaseCategoryRepo.save(category);
  }

  async findAll(dto: FilterInsightCategoryDto, user: User) {
    const { take, skip, include, orderBy, sortType } = dto;
    const query = this.useCaseCategoryRepo.createQueryBuilder('useCaseCategory');

    const canViewSandbox = user.hasPermission(UserPermissionsType.CAN_VIEW_SANDBOX_INSIGHT_CATEGORY);
    if (!canViewSandbox) {
      query.andWhere('useCaseCategory.isSandbox= :isSandbox', { isSandbox: false });
    }

    const allowedRelations: FindOptionsRelations<UseCaseCategory> = {
      useCases: true,
    };

    if (include) {
      Utils.queryIncludeV2<UseCaseCategory>(query, include, allowedRelations);
    }

    if (orderBy) {
      this._categoryOrderBy(query, orderBy, sortType);
    }
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<UseCaseCategory>(data, total);
  }

  async findOne(id: string) {
    const category = await this.useCaseCategoryRepo.findOne({
      where: { id: id },
    });
    if (!category) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateUseCaseCategoryDto) {
    const { name, isSandbox } = updateCategoryDto;
    const updateResult = await this.useCaseCategoryRepo.update(id, {
      name,
      isSandbox,
    });
    if (!updateResult || updateResult.affected == 0) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleteResult = await this.useCaseCategoryRepo.delete(id);
    if (!deleteResult || deleteResult.affected == 0) throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
  }

  private _categoryOrderBy(query: SelectQueryBuilder<UseCaseCategory>, orderBy: CategoryOrder, sortType: SortType) {
    switch (orderBy) {
      case CategoryOrder.CREATED_AT:
        query.orderBy('useCaseCategory.createdAt', sortType);
        break;
      case CategoryOrder.UPDATED_AT:
        query.orderBy('useCaseCategory.updatedAt', sortType);
        break;
      case CategoryOrder.NAME:
        query.orderBy('useCaseCategory.name', sortType);
        break;
    }
  }
}
