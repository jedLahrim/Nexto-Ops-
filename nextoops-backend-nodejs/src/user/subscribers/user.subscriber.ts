import { DataSource, EntitySubscriberInterface, RemoveEvent } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Constant } from '../../commons/constant';
import { User } from '../entities/user.entity';
import { MauticService } from '../../mail/mautic/mautic.service';

@Injectable()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    private dataSource: DataSource,
    private mauticService: MauticService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  afterRemove(event: RemoveEvent<User>): Promise<any> | void {
    // remove user from mautic by email or mailingId
    const user = event.entity;
    // const user =await event.manager.connection.getRepository(User).findOneBy({ id: userId });
    if (user?.email && Constant.ENABLE_MAUTIC) {
      return this.mauticService.removeContact(user.email, user.mailingId);
    }
  }
}
