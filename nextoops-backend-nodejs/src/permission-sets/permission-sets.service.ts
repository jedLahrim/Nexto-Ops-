import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionSet } from './entities/permission-set.entity';
import { ERP_PRESETS } from '../commons/permissions/erp-presets';
import { normalizeErpModules } from '../commons/permissions/erp-modules';

@Injectable()
export class PermissionSetsService {
  constructor(
    @InjectRepository(PermissionSet)
    private readonly repo: Repository<PermissionSet>,
  ) {}

  async findAll(): Promise<PermissionSet[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<PermissionSet> {
    const set = await this.repo.findOne({ where: { id } });
    if (!set) throw new NotFoundException(`Permission set ${id} not found`);
    return set;
  }

  async create(dto: { name: string; description?: string; modules: string[] }): Promise<PermissionSet> {
    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      modules: normalizeErpModules(dto.modules),
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: { name?: string; description?: string; modules?: string[] }): Promise<PermissionSet> {
    const set = await this.findOne(id);
    if (dto.name !== undefined) set.name = dto.name;
    if (dto.description !== undefined) set.description = dto.description;
    if (dto.modules !== undefined) set.modules = normalizeErpModules(dto.modules);
    return this.repo.save(set);
  }

  async remove(id: string): Promise<void> {
    const set = await this.findOne(id);
    await this.repo.remove(set);
  }

  /** Seed built-in presets if they don't exist yet. */
  async seed(): Promise<PermissionSet[]> {
    const existing = await this.repo.find({ where: { isBuiltIn: true } });
    const existingNames = new Set(existing.map((s) => s.name));

    const toCreate: PermissionSet[] = [];
    for (const [, preset] of Object.entries(ERP_PRESETS)) {
      if (!existingNames.has(preset.label)) {
        toCreate.push(
          this.repo.create({
            name: preset.label,
            description: preset.description,
            modules: preset.modules as string[],
            isBuiltIn: true,
          }),
        );
      }
    }

    if (toCreate.length > 0) {
      await this.repo.save(toCreate);
    }

    return this.repo.find({ order: { createdAt: 'ASC' } });
  }
}
