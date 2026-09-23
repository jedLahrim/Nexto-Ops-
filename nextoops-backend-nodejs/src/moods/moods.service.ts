import { Injectable } from '@nestjs/common';
import { CreateMoodDto } from './dto/create-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { EmotionState } from '../entries/enums/emotion-state.enum';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Mood } from './entities/mood.entity';
import { Entry } from '../entries/entities/entry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { FilterMoodDto } from './dto/filter-mood.dto';
import { User } from '../user/entities/user.entity';
import { Pagination } from '../commons/pagination/pagination';

@Injectable()
export class MoodsService {
  _multipliers: Record<EmotionState, number> = {
    [EmotionState.HAPPY]: 5,
    [EmotionState.CALM]: 4,
    [EmotionState.FINE]: 3,
    [EmotionState.SAD]: 2,
    [EmotionState.ANGRY]: 1,
  };

  constructor(
    @InjectRepository(Mood) private readonly moodRepo: Repository<Mood>,
    @InjectRepository(Entry) private readonly entryRepo: Repository<Entry>,
  ) {}

  async recomputeDailyMood(userId: string, createdAt: Date): Promise<void> {
    const startDate = moment(createdAt).startOf('day').toDate();
    const endDate = moment(createdAt).endOf('day').toDate();
    const entries = await this.entryRepo.find({
      where: { userId, createdAt: Between(startDate, endDate) },
    });

    const emotions = entries.map((e) => e.emotion);
    // group emotions by value without count of each one
    // example {EmotionState.HAPPY: 10,EmotionState.CALM:2}
    // group and count each emotion
    const groupedEmotions = emotions.reduce(
      (acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      },
      {} as Record<EmotionState, number>,
    );
    const listOfScoreMultiplier = Object.keys(groupedEmotions).map((key) => {
      const countOfEmotion = groupedEmotions[key as EmotionState];
      const multiplier = this._multipliers[key as EmotionState];
      return countOfEmotion * multiplier;
    });

    const totalScore = listOfScoreMultiplier.reduce((a, b) => a + b, 0) / emotions.length;

    let dominantEmotion: EmotionState | null = null;

    const roundedScore = Math.round(totalScore);
    // get emotion by number from _multipliers
    for (const [emotion, multiplier] of Object.entries(this._multipliers)) {
      if (multiplier === roundedScore) {
        dominantEmotion = emotion as EmotionState;
        break;
      }
    }

    const mood = await this.moodRepo.findOne({ where: { userId, createdAt: Between(startDate, endDate) } });
    if (mood) {
      mood.dominantEmotion = dominantEmotion;
      await this.moodRepo.save(mood);
    } else {
      const newMood = this.moodRepo.create({
        userId,
        date: createdAt,
        dominantEmotion,
      });
      await this.moodRepo.save(newMood);
    }
  }

  create(createMoodDto: CreateMoodDto) {
    return 'This action adds a new mood';
  }

  async findAll(dto: FilterMoodDto, me: User) {
    const { skip, take, startDate, endDate } = dto;
    const query = this.moodRepo.createQueryBuilder('mood');

    query.where('mood.userId = :userId', { userId: me.id });


    if (startDate) {
      query.andWhere('mood.date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('mood.date <= :endDate', { endDate });
    }

    query.orderBy('mood.date', 'DESC').take(take).skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination(data, total);
  }

  findOne(id: number) {
    return `This action returns a #${id} mood`;
  }

  update(id: number, updateMoodDto: UpdateMoodDto) {
    return `This action updates a #${id} mood`;
  }

  remove(id: number) {
    return `This action removes a #${id} mood`;
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
}
