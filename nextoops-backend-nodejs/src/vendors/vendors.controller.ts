import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorDto } from './dto/filter-vendor.dto';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ErpModuleGuard('vendor'))
  create(@Body() dto: CreateVendorDto, @GetUser() user: User) {
    return this.vendorsService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() dto: FilterVendorDto) {
    return this.vendorsService.findAll(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('vendor'))
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto, @GetUser() user: User) {
    return this.vendorsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('vendor'))
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.vendorsService.remove(id, user);
  }
}
