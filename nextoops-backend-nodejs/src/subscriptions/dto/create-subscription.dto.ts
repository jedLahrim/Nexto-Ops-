import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubscriptionType } from '../enum/subscription-type.enum';
import { Currency } from '../enum/currency.enum';
import { PeriodType } from '../enum/period-type.enum';
import { Store } from '../enum/store.enum';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsEnum(PeriodType)
  periodType: PeriodType;

  @IsString()
  entitlementId: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  isFamilyShare: boolean;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsEnum(Store)
  store: Store;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  presentedOfferingId?: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsNumber()
  commissionPercentage?: number;

  @IsOptional()
  @IsNumber()
  takeHomePercentage?: number;

  @IsOptional()
  purchasedAt?: Date;

  @IsOptional()
  expirationAt?: Date;

  @IsOptional()
  cancelledAt?: Date;

  @IsOptional()
  uncancelledAt?: Date;

  @IsOptional()
  renewalAt?: Date;

  @IsOptional()
  issuedAt?: Date;

  @IsOptional()
  pausedAt?: Date;

  @TransformJson
  @IsOptional()
  metaData?: Record<string, unknown>;
}
