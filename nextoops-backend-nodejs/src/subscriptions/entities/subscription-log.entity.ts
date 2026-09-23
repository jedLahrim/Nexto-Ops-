import { Subscription } from './subscription.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';
import { SubscriptionBase } from '../class/subscription-base';

@Entity()
export class SubscriptionLog extends SubscriptionBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.subscriptionLogs, {
    onDelete: 'CASCADE',
  })
  subscription: Subscription;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    onDelete: 'CASCADE',
  })
  @Exclude()
  user: User;

  @Column()
  userId: string;
}
