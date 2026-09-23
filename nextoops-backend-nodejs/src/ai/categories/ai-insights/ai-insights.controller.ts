import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';
import { CreateAiInsightDto } from './dto/create-ai-insight.dto';
import { UpdateAiInsightDto } from './dto/update-ai-insight.dto';
import { GetUser } from '../../../user/get-user.decorator';
import { User } from '../../../user/entities/user.entity';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { FilterAiInsightDto } from './dto/filter-ai-insight.dto';
import { ModifyAiInsightDto } from './dto/modify-ai-insight.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('ai/insights')
export class AiInsightsController {
  constructor(private readonly aiInsightsService: AiInsightsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAiInsightDto: CreateAiInsightDto, @GetUser() user: User) {
    return this.aiInsightsService.create(createAiInsightDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() filterDto: FilterAiInsightDto, @GetUser() user: User) {
    return this.aiInsightsService.findAll(filterDto, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.aiInsightsService.findOneOrFail(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAiInsightDto: UpdateAiInsightDto) {
    return this.aiInsightsService.update(id, updateAiInsightDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.aiInsightsService.remove(id);
  }

  @Post(':id/modify')
  @UseGuards(JwtAuthGuard)
  modify(@Param('id') id: string, @Body() modifyAiInsightDto: ModifyAiInsightDto, @GetUser() user: User) {
    return this.aiInsightsService.modify(id, modifyAiInsightDto, user);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  share(@Param('id') id: string, @GetUser() user: User) {
    return this.aiInsightsService.share(id, user);
  }

  @Post(':id/notify')
  @UseGuards(JwtAuthGuard)
  notify(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.aiInsightsService.notify(id, i18n);
  }
}
