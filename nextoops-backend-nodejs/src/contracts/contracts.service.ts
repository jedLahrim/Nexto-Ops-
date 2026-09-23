import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';

@Injectable()
export class ContractsService {
  constructor(@InjectRepository(Contract) private readonly repo: Repository<Contract>) {}

  findAll() { return this.repo.find({ relations: ['vendor'], order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id }, relations: ['vendor'] });
    if (!item) throw new NotFoundException('Contract not found');
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
