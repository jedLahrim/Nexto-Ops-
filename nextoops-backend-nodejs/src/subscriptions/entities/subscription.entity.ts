import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionType } from '../enum/subscription-type.enum';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { SubscriptionLog } from './subscription-log.entity';
import { SubscriptionBase } from '../class/subscription-base';

@Entity()
export class Subscription extends SubscriptionBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    onDelete: 'CASCADE',
  })
  @Exclude()
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => SubscriptionLog, (subscriptionLog) => subscriptionLog.subscription)
  subscriptionLogs: SubscriptionLog[];

  @Expose({ name: 'active' })
  get active() {
    switch (this.type) {
      case SubscriptionType.EXPIRATION:
      case SubscriptionType.SUBSCRIPTION_PAUSED:
        return false;
      default:
        return true;
    }
  }
}
