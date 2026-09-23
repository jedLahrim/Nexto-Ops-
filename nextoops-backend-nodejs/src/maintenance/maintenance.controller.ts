import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Get()
  @UseGuards(ErpModuleGuard('maintenance'))
  findAll() { return this.service.findAll(); }

  @Post()
  @UseGuards(ErpModuleGuard('maintenance'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @UseGuards(ErpModuleGuard('maintenance'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @UseGuards(ErpModuleGuard('maintenance'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
