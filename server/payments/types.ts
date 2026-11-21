import type { BillingInterval } from '../../src/types/playroom.ts';

export interface CreateCheckoutInput {
  reference: string;
  userId: string;
  planCode: 'plus_monthly' | 'plus_annual';
  billingInterval: BillingInterval;
  amountCents: number;
  currency: string;
  providerProductId?: string | null;
  customerEmail: string;
  customerName: string;
  description: string;
  returnUrl: string;
}

export interface CreateCheckoutResult {
  configured: boolean;
  provider: string;
  checkoutUrl?: string;
  providerCheckoutSessionId?: string;
  providerTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  missingConfiguration?: string[];
}

export interface VerifyPaymentInput {
  reference: string;
  providerCheckoutSessionId?: string | null;
  providerTransactionId?: string | null;
  expectedAmountCents: number;
  expectedCurrency: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amountCents?: number;
  currency?: string;
  providerTransactionId?: string;
  providerSubscriptionId?: string;
  renewsAt?: string | null;
  failureReason?: string;
  rawPayload?: Record<string, unknown>;
  errorMessage?: string;
}

export interface CancelSubscriptionInput {
  providerSubscriptionId: string;
  cancelImmediately?: boolean;
}

export interface CancelSubscriptionResult {
  success: boolean;
  cancelledAt: string | null;
  renewsAt?: string | null;
  errorMessage?: string;
}

export type NormalizedBillingEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.active'
  | 'subscription.renewed'
  | 'subscription.past_due'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'ignored';

export interface NormalizedWebhookEvent {
  eventId: string;
  eventType: NormalizedBillingEventType;
  reference: string | null;
  providerTransactionId: string | null;
  providerCheckoutSessionId: string | null;
  providerSubscriptionId: string | null;
  userId: string | null;
  planCode: string | null;
  amountCents: number | null;
  currency: string | null;
  renewsAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  rawPayload: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: NormalizedWebhookEvent;
  errorMessage?: string;
}

/**
 * Provider-independent Merchant of Record (MoR) payment adapter contract.
 * Keeps PLAYROOM business logic decoupled from any specific payment processor.
 */
export interface PaymentProviderAdapter {
  readonly providerId: string;
  readonly displayName: string;
  isConfigured(planCode?: 'plus_monthly' | 'plus_annual'): boolean;
  getMissingConfiguration(planCode?: 'plus_monthly' | 'plus_annual'): string[];
  createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult>;
  verifyWebhookAndParse(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): WebhookVerificationResult;
}
