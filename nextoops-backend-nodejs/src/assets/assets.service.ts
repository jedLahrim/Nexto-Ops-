import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async findAll(type: string) {
    return this.assetRepo.find({
      where: { type },
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const asset = await this.assetRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(type: string, dto: any) {
    // Generate a simple tag if none provided
    const tag = dto.assetTag || `AST-${Date.now().toString().slice(-6)}`;
    
    const asset = this.assetRepo.create({
      ...dto,
      assetTag: tag,
      type,
    });
    
    return this.assetRepo.save(asset);
  }

  async update(id: string, dto: any) {
    const asset = await this.findOne(id);
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async remove(id: string) {
    const asset = await this.findOne(id);
    return this.assetRepo.remove(asset);
  }

  async assign(id: string, user: User | null) {
    const asset = await this.findOne(id);
    asset.assignedTo = user;
    asset.status = user ? 'In Use' : 'Available';
    return this.assetRepo.save(asset);
  }
}
