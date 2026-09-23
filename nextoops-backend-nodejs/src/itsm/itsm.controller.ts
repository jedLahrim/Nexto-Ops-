import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { ItsmService } from './itsm.service';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { TicketStatus } from '../commons/utils/ticket.utils';

@Controller('itsm')
@UseGuards(JwtAuthGuard)
export class ItsmController {
  constructor(private readonly service: ItsmService) {}

  @Get('incidents')
  @UseGuards(ErpModuleGuard('incidents'))
  getIncidents() {
    return this.service.findAll('incident');
  }

  @Post('incidents')
  @UseGuards(ErpModuleGuard('incidents'))
  createIncident(@Body() dto: any, @GetUser() user: User) {
    return this.service.create('incident', dto, user);
  }

  @Get('problems')
  @UseGuards(ErpModuleGuard('problems'))
  getProblems() {
    return this.service.findAll('problem');
  }

  @Post('problems')
  @UseGuards(ErpModuleGuard('problems'))
  createProblem(@Body() dto: any, @GetUser() user: User) {
    return this.service.create('problem', dto, user);
  }

  @Get('changes')
  @UseGuards(ErpModuleGuard('changes'))
  getChanges() {
    return this.service.findAll('change');
  }

  @Post('changes')
  @UseGuards(ErpModuleGuard('changes'))
  createChange(@Body() dto: any, @GetUser() user: User) {
    return this.service.create('change', dto, user);
  }

  @Get(':id')
  getTicket(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  updateTicket(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  deleteTicket(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: { status: TicketStatus }) {
    return this.service.updateStatus(id, dto.status);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.service.getMessages(id);
  }
}
