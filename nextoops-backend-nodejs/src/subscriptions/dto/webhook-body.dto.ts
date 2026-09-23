import { SubscriptionType } from '../enum/subscription-type.enum';
import { PeriodType } from '../enum/period-type.enum';
import { Currency } from '../enum/currency.enum';
import { Store } from '../enum/store.enum';

export class WebhookBodyDto {
  event: WebhookEventBody;
  api_version: string;
}

export class WebhookEventBody {
  event_timestamp_ms: number;
  product_id: string;
  period_type: PeriodType;
  purchased_at_ms: number;
  expiration_at_ms: number;
  environment: string;
  entitlement_id: string | null;
  entitlement_ids: string[];
  presented_offering_id: string | null;
  transaction_id: string;
  original_transaction_id: string;
  is_family_share: boolean;
  country_code: string;
  app_user_id: string;
  aliases: string[];
  original_app_user_id: string;
  currency: Currency;
  price: number;
  price_in_purchased_currency: number;
  subscriber_attributes: SubscriberAttributes;
  store: Store;
  takehome_percentage: number;
  tax_percentage: number;
  commission_percentage: number;
  offer_code: string | null;
  type: SubscriptionType;
  id: string;
  app_id: string;
}

export class SubscriberAttributes {
  key: JSON;
}

export class $Email {
  updated_at_ms: number;
  value: string;
}

export class MetaData {
  subscriber_attributes: SubscriberAttributes;
}
