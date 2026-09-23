import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../../commons/guards/erp-module.guard';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/entities/user.entity';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ErpModuleGuard('department'))
  create(@Body() dto: CreateDepartmentDto, @GetUser() user: User) {
    return this.departmentsService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() dto: PaginationDto) {
    return this.departmentsService.findAll(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('department'))
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @GetUser() user: User) {
    return this.departmentsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('department'))
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.departmentsService.remove(id, user);
  }
}
