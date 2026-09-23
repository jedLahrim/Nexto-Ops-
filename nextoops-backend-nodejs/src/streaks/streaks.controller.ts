import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { User } from '../user/entities/user.entity';
import { GetUser } from '../user/get-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { FilterStreakDto } from './dto/filter-streak.dto';

@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@GetUser() me: User,@Query()  dto: FilterStreakDto) {
    return this.streaksService.findAll(me, dto);
  }
}
