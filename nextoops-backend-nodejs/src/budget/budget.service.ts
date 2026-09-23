import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetItem } from './entities/budget-item.entity';

@Injectable()
export class BudgetService {
  constructor(@InjectRepository(BudgetItem) private readonly repo: Repository<BudgetItem>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Budget item not found');
    return item;
  }

  create(dto: any) { return this.repo.save(this.repo.create(dto)); }

  async update(id: string, dto: any) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
