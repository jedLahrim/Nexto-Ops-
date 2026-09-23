import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { PaginationDto } from '../commons/pagination/pagination.dto';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { UserTypeGuard } from '../user/guards/user-type.guard';
import { UserType } from '../user/enums/user-type.enum';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /** Latest 50 audit entries — used by the frontend Audit log page. */
  @Get('recent')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  recent() {
    return this.auditService.findAll({ take: 50, skip: 0 } as PaginationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ErpModuleGuard('audit'))
  findAll(
    @Query() dto: PaginationDto,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.findAll(dto, { entity, entityId, userId });
  }
}
