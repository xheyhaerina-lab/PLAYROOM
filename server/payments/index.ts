import { envConfig } from '../config.ts';
import { DodoPaymentsAdapter } from './dodo.ts';
import type { PaymentProviderAdapter } from './types.ts';

export type {
  CancelSubscriptionInput,
  CancelSubscriptionResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  NormalizedBillingEventType,
  NormalizedWebhookEvent,
  PaymentProviderAdapter,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookVerificationResult,
} from './types.ts';

export function resolvePaymentProvider(): PaymentProviderAdapter {
  // Extensible provider registry. Currently selects DodoPaymentsAdapter for international USD MoR billing.
  switch (envConfig.paymentProvider) {
    case 'dodo_payments':
    default:
      return new DodoPaymentsAdapter();
  }
}

export const paymentProvider: PaymentProviderAdapter = resolvePaymentProvider();
