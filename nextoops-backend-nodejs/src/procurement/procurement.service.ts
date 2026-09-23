import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseOrder) private readonly repo: Repository<PurchaseOrder>,
  ) {}

  private async generatePoNumber(): Promise<string> {
    const last = await this.repo.findOne({ order: { createdAt: 'DESC' } });
    let num = 1;
    if (last?.poNumber) {
      const m = last.poNumber.match(/\d+$/);
      if (m) num = parseInt(m[0], 10) + 1;
    }
    return `PO-${num.toString().padStart(4, '0')}`;
  }

  findAll() { return this.repo.find({ relations: ['vendor'], order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id }, relations: ['vendor'] });
    if (!item) throw new NotFoundException('Purchase order not found');
    return item;
  }

  async create(dto: any) {
    const poNumber = await this.generatePoNumber();
    return this.repo.save(this.repo.create({ ...dto, poNumber }));
  }

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
