import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { BudgetService } from './budget.service';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get() @UseGuards(ErpModuleGuard('budget'))
  findAll() { return this.service.findAll(); }

  @Post() @UseGuards(ErpModuleGuard('budget'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @UseGuards(ErpModuleGuard('budget'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(ErpModuleGuard('budget'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
