import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Pagination } from '../commons/pagination/pagination';
import { PaginationDto } from '../commons/pagination/pagination.dto';

export interface WriteAuditInput {
  userId?: string;
  userLabel?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  /** Append an immutable audit-trail record. Never edit or delete audit rows. */
  async log(input: WriteAuditInput): Promise<AuditLog> {
    const record = this.auditLogRepo.create({
      userId: input.userId,
      userLabel: input.userLabel,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details,
    });
    return this.auditLogRepo.save(record);
  }

  /** List audit entries with pagination, optionally filtered by entity/entityId. */
  async findAll(
    dto: PaginationDto,
    filters?: { entity?: string; entityId?: string; userId?: string },
  ): Promise<Pagination<AuditLog>> {
    const query = this.auditLogRepo
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.createdAt', 'DESC');

    if (filters?.entity) {
      query.andWhere('auditLog.entity = :entity', { entity: filters.entity });
    }
    if (filters?.entityId) {
      query.andWhere('auditLog.entityId = :entityId', { entityId: filters.entityId });
    }
    if (filters?.userId) {
      query.andWhere('auditLog.userId = :userId', { userId: filters.userId });
    }

    query.take(dto.take);
    query.skip(dto.skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<AuditLog>(data, total);
  }
}
