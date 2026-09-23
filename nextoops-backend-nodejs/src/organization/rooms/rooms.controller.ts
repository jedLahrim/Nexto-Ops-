import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../../commons/guards/erp-module.guard';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/entities/user.entity';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ErpModuleGuard('room'))
  create(@Body() dto: CreateRoomDto, @GetUser() user: User) {
    return this.roomsService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() dto: PaginationDto,
    @Query('departmentId') departmentId?: string,
    @Query('roomType') roomType?: string,
  ) {
    return this.roomsService.findAll(dto, departmentId, roomType);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('room'))
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto, @GetUser() user: User) {
    return this.roomsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ErpModuleGuard('room'))
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.roomsService.remove(id, user);
  }
}
