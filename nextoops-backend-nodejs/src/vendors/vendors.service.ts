import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorDto } from './dto/filter-vendor.dto';
import { Pagination } from '../commons/pagination/pagination';
import { AppError } from '../commons/errors/app-error';
import { ERR_NOT_FOUND_VENDOR } from '../commons/errors/erp-error-codes';
import { AuditService } from '../audit/audit.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateVendorDto, user: User): Promise<Vendor> {
    const vendor = this.vendorRepo.create(dto);
    const saved = await this.vendorRepo.save(vendor);

    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'vendor.create',
      entity: 'vendor',
      entityId: saved.id,
      details: `Created vendor: ${saved.name}`,
    });

    return saved;
  }

  async findAll(dto: FilterVendorDto): Promise<Pagination<Vendor>> {
    const query = this.vendorRepo.createQueryBuilder('vendor');

    if (dto.category) {
      query.andWhere('vendor.category = :category', { category: dto.category });
    }
    if (dto.status) {
      query.andWhere('vendor.status = :status', { status: dto.status });
    }

    query.orderBy('vendor.createdAt', 'DESC');
    query.take(dto.take);
    query.skip(dto.skip);

    const [data, total] = await query.getManyAndCount();
    return new Pagination<Vendor>(data, total);
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException(new AppError(ERR_NOT_FOUND_VENDOR));
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, user: User): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    const saved = await this.vendorRepo.save(vendor);

    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'vendor.update',
      entity: 'vendor',
      entityId: saved.id,
      details: `Updated vendor: ${saved.name}`,
    });

    return saved;
  }

  async remove(id: string, user: User): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorRepo.softRemove(vendor);

    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'vendor.delete',
      entity: 'vendor',
      entityId: vendor.id,
      details: `Deleted vendor: ${vendor.name}`,
    });
  }
}
