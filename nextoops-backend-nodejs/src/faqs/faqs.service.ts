import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { AppError } from '../commons/errors/app-error';
import { Faq } from './entities/faq.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { ERR_NOT_FOUND_TAG } from '../commons/errors/errors-codes';
import { Pagination } from '../commons/pagination/pagination';
import { FilterFaqDto } from './dto/filter-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private faqRepo: Repository<Faq>,
  ) {}

  async create(createFaqDto: CreateFaqDto, user: User) {
    let { userType, question, answer } = createFaqDto;

    const faq = this.faqRepo.create({
      userType: userType,
      user: user,
      answer,
      question,
    });
    return await this.faqRepo.save(faq);
  }

  async findAll(filterFaqDto: FilterFaqDto) {
    let { userType, take, skip } = filterFaqDto;
    let query = this.faqRepo.createQueryBuilder('faq');
    if (userType) query.where('faq.userType= :userType  ', { userType });
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<Faq>(data, total);
  }

  async findOne(id: string, user: User) {
    let faq = await this.faqRepo.findOne({
      where: { id: id, user: { id: user.id } },
      relations: { user: true },
    });
    if (!faq) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto, user: User) {
    let updateResult = await this.faqRepo.update(id, {
      userType: updateFaqDto.userType,
      user: user,
      answer: updateFaqDto.answer,
      question: updateFaqDto.question,
    });
    if (updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
    return this.findOne(id, user);
  }

  async remove(id: string) {
    let deleteResult = await this.faqRepo.delete(id);
    if (deleteResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
  }
}
