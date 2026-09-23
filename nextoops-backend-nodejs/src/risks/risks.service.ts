import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk } from './entities/risk.entity';

@Injectable()
export class RisksService {
  constructor(@InjectRepository(Risk) private readonly repo: Repository<Risk>) {}

  findAll() { return this.repo.find({ relations: ['owner'], order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id }, relations: ['owner'] });
    if (!item) throw new NotFoundException('Risk not found');
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
