import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InternalServerErrorException } from '@nestjs/common';
import { MauticService } from '../mautic.service';
import { AppError } from '../../../commons/errors/app-error';
import { ERR_MAUTIC } from '../../../commons/errors/errors-codes';

abstract class IMauticQueueProcessor {
  abstract importContacts(job: Job);
}

@Processor('mautic_queue')
export class MauticQueueProcessor implements IMauticQueueProcessor {
  constructor(private mauticService: MauticService) {}

  @Process('import_contacts')
  async importContacts(job: Job) {
    try {
      const listDataParts = job.data.listDataParts;
      for (const listData of listDataParts) {
        await this.mauticService.syncData(listData);
        console.log(`import_contacts success data`);
      }
      console.log(`import_contacts all success`);
    } catch (e) {
      console.log(`import_contacts error=${e}`);
      throw new InternalServerErrorException(new AppError(ERR_MAUTIC));
    }
  }
}
