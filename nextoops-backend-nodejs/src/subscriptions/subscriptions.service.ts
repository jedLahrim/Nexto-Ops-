import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookBodyDto } from './dto/webhook-body.dto';
import { SubscriptionType } from './enum/subscription-type.enum';
import { AppError } from '../commons/errors/app-error';
import { ERR_NOT_FOUND_SUBSCRIPTION, ERR_NOT_FOUND_USER } from '../commons/errors/errors-codes';
import { SubscriptionLog } from './entities/subscription-log.entity';
import { Utils } from '../commons/utils';
import { User } from '../user/entities/user.entity';
import { SubscriptionChangedEvent } from '../event-listeners/events/subscription-changed.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionLog)
    private subscriptionLogRepo: Repository<SubscriptionLog>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createSubscriptionLog(subscriptionId: string, dto: CreateSubscriptionDto) {
    const subscriptionLog = this.subscriptionLogRepo.create({
      ...dto,
      subscriptionId,
    });
    return this.subscriptionLogRepo.save(subscriptionLog);
  }

  findAll() {
    return `This action returns all subscriptions`;
  }

  async findOne(id: string) {
    const subscription = await this.subscriptionRepo.findOne({ where: { id } });
    if (!subscription) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_SUBSCRIPTION));
    }
    return subscription;
  }

  async remove(id: string) {
    const deleteResult = await this.subscriptionRepo.delete({ id: id });
    if (deleteResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_SUBSCRIPTION));
    }
  }

  async webhook(webhookBodyDto: WebhookBodyDto) {
    const { event, api_version } = webhookBodyDto;
    if (!event) return;
    let skippedEventTypes: SubscriptionType[] = [SubscriptionType.EXPERIMENT_ENROLLMENT];
    if (skippedEventTypes.includes(event.type)) {
      return;
    }

    let dto: CreateSubscriptionDto = this.getSubscriptionDto(webhookBodyDto);
    let isPremium = false;
    const now = new Date();
    switch (event.type) {
      case SubscriptionType.INITIAL_PURCHASE:
        dto.purchasedAt = Utils.formatTimestamp(event.purchased_at_ms);
        isPremium = true;
        break;
      case SubscriptionType.RENEWAL:
        dto.renewalAt = now;
        isPremium = true;
        break;
      case SubscriptionType.CANCELLATION:
        dto.cancelledAt = now;
        break;
      case SubscriptionType.EXPIRATION:
        dto.expirationAt = Utils.formatTimestamp(event.expiration_at_ms);
        break;
      case SubscriptionType.UNCANCELLATION:
        dto.uncancelledAt = now;
        break;
      case SubscriptionType.SUBSCRIPTION_PAUSED:
        dto.pausedAt = now;
        break;
      case SubscriptionType.BILLING_ISSUE:
        dto.issuedAt = now;
        break;
    }

    if (isPremium) {
      this.eventEmitter.emit('subscription.changed', {
        userId: dto.userId,
      } as SubscriptionChangedEvent);
    }

    const subscription = await this.saveByWebhook(dto);
    await this.createSubscriptionLog(subscription.id, dto);
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const updateResult = await this.subscriptionRepo.update(
      { id },
      {
        ...updateSubscriptionDto,
      },
    );
    if (updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_SUBSCRIPTION));
    }
  }

  create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionRepo.create({
      ...dto,
    });
    return this.subscriptionRepo.save(subscription);
  }

  private getSubscriptionDto(webhookBodyDto: WebhookBodyDto): CreateSubscriptionDto {
    const { event } = webhookBodyDto;
    return {
      metaData: { ...webhookBodyDto },
      type: event.type,
      currency: event.currency,
      periodType: event.period_type,
      entitlementId: event.entitlement_ids[0],
      price: event.price,
      isFamilyShare: event.is_family_share,
      store: event.store,
      countryCode: event.country_code,
      userId: event.app_user_id,
      presentedOfferingId: event.presented_offering_id,
      productId: event.product_id,
      transactionId: event.transaction_id,
      commissionPercentage: event.commission_percentage,
      takeHomePercentage: event.takehome_percentage,
      purchasedAt: Utils.formatTimestamp(event.purchased_at_ms),
      expirationAt: Utils.formatTimestamp(event.expiration_at_ms),
    };
  }

  private async saveByWebhook(dto: CreateSubscriptionDto) {
    const { userId, entitlementId, type } = dto;

    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, entitlementId },
    });
    if (subscription) {
      // SKIP update in case subscription type already is EXPIRATION and the new coming one is CANCELLATION or BILLING_ISSUE
      // which can send via webhook instantly in different order
      const skipUpdate =
        subscription.type == SubscriptionType.EXPIRATION &&
        (type == SubscriptionType.CANCELLATION || type == SubscriptionType.BILLING_ISSUE);

      if (!skipUpdate) await this.update(subscription.id, dto);
      return this.findOne(subscription.id);
    } else {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
      return this.create(dto);
    }
  }
}
