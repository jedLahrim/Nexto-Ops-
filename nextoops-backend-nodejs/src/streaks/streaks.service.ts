import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Streak } from './entities/streak.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { FilterStreakDto, StreakOrderBy } from './dto/filter-streak.dto';
import { Pagination } from '../commons/pagination/pagination';
import { SortType } from '../commons/enums/sortType';

@Injectable()
export class StreaksService {
  constructor(@InjectRepository(Streak) private readonly streakRepo: Repository<Streak>) {}

  async createIfNotExists(user: User, entryAt: Date) {
    const now = entryAt ?? new Date();

    let streak = await this.streakRepo
      .createQueryBuilder('streak')
      .where('streak.createdById = :userId', { userId: user.id })
      .andWhere('DATE(streak.entryAt) = DATE(:now)', { now })
      .getOne();

    if (streak) return streak;

    streak = this.streakRepo.create({
      entryAt: now,
      createdById: user.id,
    });
    return this.streakRepo.save(streak);
  }

  async removeForDay(userId: string, entryAt: Date) {
    const now = entryAt ?? new Date();
    await this.streakRepo
      .createQueryBuilder()
      .delete()
      .from('streak')
      .where('createdById = :userId', { userId })
      .andWhere('DATE(entryAt) = DATE(:today)', { today: now })
      .execute();
  }

  async findAll(me: User, dto: FilterStreakDto) {
    let { take, skip, orderBy, sortType } = dto;
    let query = this.streakRepo.createQueryBuilder('streak');

    query.where(`${query.alias}.createdById = :createdById`, { createdById: me.id });

    if (orderBy) this._streaksOrderBy(query, orderBy, sortType);

    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();

    return new Pagination<Streak>(data, total);
  }

  private _streaksOrderBy(query: SelectQueryBuilder<Streak>, orderBy: StreakOrderBy, sortType: SortType) {
    switch (orderBy) {
      case StreakOrderBy.UPDATED_AT:
        query.orderBy(`${query.alias}.updatedAt`, sortType);
        break;
      case StreakOrderBy.CREATED_AT:
        query.orderBy(`${query.alias}.createdAt`, sortType);
        break;
      case StreakOrderBy.ENTRY_AT:
        query.orderBy(`${query.alias}.entryAt`, sortType);
        break;
    }
  }
}
