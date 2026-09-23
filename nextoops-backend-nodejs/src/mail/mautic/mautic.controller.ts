import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { UserTypeGuard } from '../../user/guards/user-type.guard';
import { UserType } from '../../user/enums/user-type.enum';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/entities/user.entity';
import { MauticService } from './mautic.service';
import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('mautic')
export class MauticController {
  constructor(
    readonly mauticService: MauticService,
    @InjectQueue('mautic_queue') private mauticQueue: Queue,
  ) {}

  @Post('export')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async exportContacts(@GetUser() user: User, @Res() res: Response) {
    return await this.mauticService.exportContacts(res, false);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async getAllContactsByChucks(@GetUser() user: User) {
    return await this.mauticService.getAllContactsByChucks();
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async syncData(@GetUser() me: User) {
    const { listDataParts } = await this.getAllContactsByChucks(me);
    await this.mauticQueue
      .add('import_contacts', { listDataParts }, { jobId: uuid() })
      .then((r) => console.log('import_contacts queue'));
  }
}
