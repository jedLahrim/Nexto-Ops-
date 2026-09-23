import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceSchedule)
    private readonly repo: Repository<MaintenanceSchedule>,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['assignedTo'], order: { scheduledDate: 'DESC' } });
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id }, relations: ['assignedTo'] });
    if (!item) throw new NotFoundException('Schedule not found');
    return item;
  }

  create(dto: any) {
    return this.repo.save(this.repo.create(dto));
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
