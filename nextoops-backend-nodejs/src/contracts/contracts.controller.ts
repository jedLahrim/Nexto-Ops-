import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get() @UseGuards(ErpModuleGuard('contracts'))
  findAll() { return this.service.findAll(); }

  @Post() @UseGuards(ErpModuleGuard('contracts'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @UseGuards(ErpModuleGuard('contracts'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(ErpModuleGuard('contracts'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
