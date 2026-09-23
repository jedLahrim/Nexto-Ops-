import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MoodsService } from './moods.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { FilterMoodDto } from './dto/filter-mood.dto';

@Controller('moods')
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Post()
  create(@Body() createMoodDto: CreateMoodDto) {
    return this.moodsService.create(createMoodDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() dto: FilterMoodDto, @GetUser() me: User) {
    return this.moodsService.findAll(dto, me);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moodsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMoodDto: UpdateMoodDto) {
    return this.moodsService.update(+id, updateMoodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moodsService.remove(+id);
  }
}
