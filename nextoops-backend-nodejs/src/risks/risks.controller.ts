import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { RisksService } from './risks.service';

@Controller('risks')
@UseGuards(JwtAuthGuard)
export class RisksController {
  constructor(private readonly service: RisksService) {}

  @Get() @UseGuards(ErpModuleGuard('risks'))
  findAll() { return this.service.findAll(); }

  @Post() @UseGuards(ErpModuleGuard('risks'))
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id') @UseGuards(ErpModuleGuard('risks'))
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(ErpModuleGuard('risks'))
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
