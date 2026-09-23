import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Pagination } from '../../commons/pagination/pagination';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { AppError } from '../../commons/errors/app-error';
import { ERR_NOT_FOUND_DEPARTMENT } from '../../commons/errors/erp-error-codes';
import { AuditService } from '../../audit/audit.service';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDepartmentDto, user: User): Promise<Department> {
    const dept = this.departmentRepo.create(dto);
    const saved = await this.departmentRepo.save(dept);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'department.create',
      entity: 'department',
      entityId: saved.id,
      details: `Created department: ${saved.name} (${saved.code})`,
    });
    return saved;
  }

  async findAll(dto: PaginationDto): Promise<Pagination<Department>> {
    const query = this.departmentRepo.createQueryBuilder('department');
    query.orderBy('department.name', 'ASC');
    query.take(dto.take);
    query.skip(dto.skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<Department>(data, total);
  }

  async findOne(id: string): Promise<Department> {
    const dept = await this.departmentRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(new AppError(ERR_NOT_FOUND_DEPARTMENT));
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, user: User): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);
    const saved = await this.departmentRepo.save(dept);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'department.update',
      entity: 'department',
      entityId: saved.id,
    });
    return saved;
  }

  async remove(id: string, user: User): Promise<void> {
    const dept = await this.findOne(id);
    await this.departmentRepo.softRemove(dept);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'department.delete',
      entity: 'department',
      entityId: dept.id,
    });
  }
}
