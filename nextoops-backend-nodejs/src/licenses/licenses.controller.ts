import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { LicensesService } from './licenses.service';

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private readonly service: LicensesService) {}

  @Get() @UseGuards(ErpModuleGuard('licenses'))
  findAll() { return this.service.findAll(); }

  @Post() @UseGuards(ErpModuleGuard('licenses'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @UseGuards(ErpModuleGuard('licenses'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(ErpModuleGuard('licenses'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
