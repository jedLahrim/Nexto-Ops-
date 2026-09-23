import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  @Get() @UseGuards(ErpModuleGuard('procurement'))
  findAll() { return this.service.findAll(); }

  @Post() @UseGuards(ErpModuleGuard('procurement'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @UseGuards(ErpModuleGuard('procurement'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(ErpModuleGuard('procurement'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
