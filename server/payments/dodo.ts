import crypto from 'crypto';
import { envConfig } from '../config.ts';
import type {
  CancelSubscriptionInput,
  CancelSubscriptionResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  NormalizedBillingEventType,
  PaymentProviderAdapter,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookVerificationResult,
} from './types.ts';

const WEBHOOK_TOLERANCE_SECONDS = 300; // 5-minute replay protection window per Standard Webhooks

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) {
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return undefined;
}

/**
 * Dodo Payments Merchant of Record Adapter.
 * Implements official Dodo Payments REST API & Standard Webhooks specification:
 *  - Base URLs: https://test.dodopayments.com | https://live.dodopayments.com
 *  - Checkout Sessions: POST /checkouts, GET /checkouts/{id}
 *  - Payments: GET /payments/{id}
 *  - Subscriptions: PATCH /subscriptions/{subscription_id}
 *  - Webhooks: Standard Webhooks HMAC-SHA256 (`webhook-id`, `webhook-timestamp`, `webhook-signature`, `whsec_` key)
 *
 * Never assumes account approval or fabricates successful charges when unconfigured.
 */
export class DodoPaymentsAdapter implements PaymentProviderAdapter {
  readonly providerId = 'dodo_payments';
  readonly displayName = 'Dodo Payments';

  private getBaseUrl(): string {
    return envConfig.dodoEnv === 'live_mode'
      ? 'https://live.dodopayments.com'
      : 'https://test.dodopayments.com';
  }

  private resolveProductId(
    planCode: 'plus_monthly' | 'plus_annual',
    overrideProductId?: string | null
  ): string {
    if (overrideProductId && overrideProductId.trim().length > 0) {
      return overrideProductId.trim();
    }
    return planCode === 'plus_annual'
      ? envConfig.dodoProductPlusAnnualId
      : envConfig.dodoProductPlusMonthlyId;
  }

  getMissingConfiguration(planCode?: 'plus_monthly' | 'plus_annual'): string[] {
    const missing: string[] = [];
    if (!envConfig.dodoApiKey) missing.push('DODO_PAYMENTS_API_KEY');
    if (!envConfig.dodoWebhookSecret) missing.push('DODO_PAYMENTS_WEBHOOK_SECRET');
    if (planCode === 'plus_annual') {
      if (!envConfig.dodoProductPlusAnnualId) missing.push('DODO_PRODUCT_PLUS_ANNUAL_ID');
    } else if (planCode === 'plus_monthly') {
      if (!envConfig.dodoProductPlusMonthlyId) missing.push('DODO_PRODUCT_PLUS_MONTHLY_ID');
    } else {
      if (!envConfig.dodoProductPlusMonthlyId) missing.push('DODO_PRODUCT_PLUS_MONTHLY_ID');
    }
    return missing;
  }

  isConfigured(planCode?: 'plus_monthly' | 'plus_annual'): boolean {
    return this.getMissingConfiguration(planCode).length === 0;
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const productId = this.resolveProductId(input.planCode, input.providerProductId);
    const missing = this.getMissingConfiguration(input.planCode).filter(
      (k) =>
        !(
          productId &&
          (k === 'DODO_PRODUCT_PLUS_MONTHLY_ID' || k === 'DODO_PRODUCT_PLUS_ANNUAL_ID')
        )
    );

    if (missing.length > 0 || !productId) {
      if (!productId && !missing.includes('DODO_PRODUCT_PLUS_MONTHLY_ID') && !missing.includes('DODO_PRODUCT_PLUS_ANNUAL_ID')) {
        missing.push(
          input.planCode === 'plus_annual'
            ? 'DODO_PRODUCT_PLUS_ANNUAL_ID'
            : 'DODO_PRODUCT_PLUS_MONTHLY_ID'
        );
      }
      return {
        configured: false,
        provider: this.providerId,
        errorCode: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        errorMessage:
          'Merchant of Record billing credentials are not configured on the server yet.',
        missingConfiguration: missing,
      };
    }

    const endpoint = `${this.getBaseUrl()}/checkouts`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${envConfig.dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email: input.customerEmail,
          name: input.customerName,
        },
        billing_currency: input.currency.toUpperCase(),
        return_url: input.returnUrl,
        metadata: {
          playroom_reference: input.reference,
          playroom_user_id: input.userId,
          playroom_plan_code: input.planCode,
          billing_interval: input.billingInterval,
          expected_amount_cents: String(input.amountCents),
          expected_currency: input.currency.toUpperCase(),
        },
      }),
    });

    if (!response.ok) {
      return {
        configured: true,
        provider: this.providerId,
        errorCode: 'PAYMENT_GATEWAY_ERROR',
        errorMessage: `Dodo Payments checkout API returned HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      session_id?: string;
      checkout_url?: string | null;
    };

    if (!data.session_id || !data.checkout_url) {
      return {
        configured: true,
        provider: this.providerId,
        errorCode: 'PAYMENT_GATEWAY_INVALID_RESPONSE',
        errorMessage: 'Payment provider response omitted checkout_url or session_id.',
      };
    }

    return {
      configured: true,
      provider: this.providerId,
      checkoutUrl: data.checkout_url,
      providerCheckoutSessionId: data.session_id,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!envConfig.dodoApiKey) {
      return {
        verified: false,
        status: 'pending',
        errorMessage: 'Payment provider API key is not configured on the server.',
      };
    }

    const sessionId = input.providerCheckoutSessionId;
    const paymentId = input.providerTransactionId;

    if (!sessionId && !paymentId) {
      return {
        verified: false,
        status: 'pending',
        errorMessage: 'Awaiting verified provider webhook or checkout session confirmation.',
      };
    }

    const endpoint = sessionId
      ? `${this.getBaseUrl()}/checkouts/${encodeURIComponent(sessionId)}`
      : `${this.getBaseUrl()}/payments/${encodeURIComponent(paymentId!)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${envConfig.dodoApiKey}`,
      },
    });

    if (!response.ok) {
      return {
        verified: false,
        status: 'pending',
        errorMessage: `Verification check returned HTTP ${response.status}`,
      };
    }

    const payload = (await response.json()) as {
      session_id?: string;
      payment_id?: string | null;
      subscription_id?: string | null;
      payment_status?: string | null;
      status?: string | null;
      total_amount?: number | null;
      currency?: string | null;
      next_billing_date?: string | null;
      error_message?: string | null;
    };

    const rawStatus = String(payload.payment_status || payload.status || '').toLowerCase();
    const status: VerifyPaymentResult['status'] =
      rawStatus === 'succeeded' || rawStatus === 'completed' || rawStatus === 'paid'
        ? 'completed'
        : rawStatus === 'failed'
          ? 'failed'
          : rawStatus === 'cancelled' || rawStatus === 'canceled'
            ? 'cancelled'
            : 'pending';

    const amountCents =
      typeof payload.total_amount === 'number' ? Math.trunc(payload.total_amount) : undefined;
    const currency = payload.currency ? payload.currency.toUpperCase() : undefined;

    // Require amount and currency match when reported by the checkout/payment endpoint
    const amountMatches =
      amountCents === undefined || amountCents === Math.trunc(input.expectedAmountCents);
    const currencyMatches =
      currency === undefined || currency === input.expectedCurrency.toUpperCase();

    return {
      verified: status === 'completed' && amountMatches && currencyMatches,
      status,
      amountCents,
      currency,
      providerTransactionId: payload.payment_id || input.providerTransactionId || undefined,
      providerSubscriptionId: payload.subscription_id || undefined,
      renewsAt: payload.next_billing_date || null,
      failureReason: payload.error_message || undefined,
      rawPayload: payload as Record<string, unknown>,
      errorMessage:
        status === 'completed' && (!amountMatches || !currencyMatches)
          ? 'Amount or currency mismatch detected during server verification.'
          : undefined,
    };
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    if (!envConfig.dodoApiKey) {
      return {
        success: false,
        cancelledAt: null,
        errorMessage: 'DODO_PAYMENTS_API_KEY is not configured on the server.',
      };
    }

    const endpoint = `${this.getBaseUrl()}/subscriptions/${encodeURIComponent(
      input.providerSubscriptionId
    )}`;

    const body = input.cancelImmediately
      ? { status: 'cancelled' }
      : { cancel_at_next_billing_date: true };

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${envConfig.dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        success: false,
        cancelledAt: null,
        errorMessage: `Subscription cancellation API returned HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      cancelledAt: new Date().toISOString(),
      renewsAt: null,
    };
  }

  /**
   * Standard Webhooks signature verification (used by Dodo Payments):
   * Signed content: `${webhook-id}.${webhook-timestamp}.${rawBody}`
   * Key: Base64-decoded signing secret after stripping `whsec_` prefix
   * Header: `webhook-signature` may hold space-delimited `v1,<base64>` tokens.
   */
  verifyWebhookAndParse(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): WebhookVerificationResult {
    const secret = envConfig.dodoWebhookSecret;
    if (!secret) {
      return { valid: false, errorMessage: 'Webhook secret is not configured on server.' };
    }

    const webhookId = headerValue(headers, 'webhook-id')?.trim();
    const webhookTimestamp = headerValue(headers, 'webhook-timestamp')?.trim();
    const webhookSignature = headerValue(headers, 'webhook-signature')?.trim();

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return { valid: false, errorMessage: 'Missing required Standard Webhooks headers.' };
    }

    const tsSeconds = Number(webhookTimestamp);
    if (!Number.isFinite(tsSeconds)) {
      return { valid: false, errorMessage: 'Invalid webhook timestamp.' };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - tsSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
      return { valid: false, errorMessage: 'Webhook timestamp outside replay tolerance window.' };
    }

    const rawSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
    let keyBytes: Buffer;
    try {
      keyBytes = Buffer.from(rawSecret, 'base64');
      if (keyBytes.length === 0) {
        return { valid: false, errorMessage: 'Invalid base64 webhook secret.' };
      }
    } catch {
      return { valid: false, errorMessage: 'Failed to decode webhook secret.' };
    }

    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const expectedDigestB64 = crypto
      .createHmac('sha256', keyBytes)
      .update(signedContent)
      .digest('base64');
    const expectedBuf = Buffer.from(expectedDigestB64, 'utf8');

    const signatureTokens = webhookSignature.split(/\s+/);
    let matched = false;
    for (const token of signatureTokens) {
      const [version, sig] = token.split(',', 2);
      if (version !== 'v1' || !sig) continue;
      const providedBuf = Buffer.from(sig.trim(), 'utf8');
      if (
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return { valid: false, errorMessage: 'Invalid webhook HMAC signature.' };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return { valid: false, errorMessage: 'Invalid JSON webhook body.' };
    }

    const typeStr = String(parsed.type || '').toLowerCase();
    const data = (parsed.data || {}) as Record<string, unknown>;
    const metadata = (data.metadata || {}) as Record<string, unknown>;

    let eventType: NormalizedBillingEventType = 'ignored';
    if (typeStr === 'payment.succeeded') eventType = 'payment.succeeded';
    else if (typeStr === 'payment.failed') eventType = 'payment.failed';
    else if (typeStr === 'subscription.active') eventType = 'subscription.active';
    else if (typeStr === 'subscription.renewed') eventType = 'subscription.renewed';
    else if (typeStr === 'subscription.on_hold' || typeStr === 'subscription.past_due') {
      eventType = 'subscription.past_due';
    } else if (typeStr === 'subscription.cancelled' || typeStr === 'subscription.canceled') {
      eventType = 'subscription.cancelled';
    } else if (typeStr === 'subscription.expired') {
      eventType = 'subscription.expired';
    }

    const rawAmount =
      typeof data.total_amount === 'number'
        ? data.total_amount
        : typeof data.recurring_pre_tax_amount === 'number'
          ? data.recurring_pre_tax_amount
          : null;

    return {
      valid: true,
      event: {
        eventId: webhookId,
        eventType,
        reference:
          typeof metadata.playroom_reference === 'string' ? metadata.playroom_reference : null,
        providerTransactionId: typeof data.payment_id === 'string' ? data.payment_id : null,
        providerCheckoutSessionId:
          typeof data.checkout_session_id === 'string' ? data.checkout_session_id : null,
        providerSubscriptionId:
          typeof data.subscription_id === 'string' ? data.subscription_id : null,
        userId: typeof metadata.playroom_user_id === 'string' ? metadata.playroom_user_id : null,
        planCode:
          typeof metadata.playroom_plan_code === 'string' ? metadata.playroom_plan_code : null,
        amountCents: rawAmount !== null ? Math.trunc(rawAmount) : null,
        currency: typeof data.currency === 'string' ? data.currency.toUpperCase() : null,
        renewsAt: typeof data.next_billing_date === 'string' ? data.next_billing_date : null,
        cancelledAt: typeof data.cancelled_at === 'string' ? data.cancelled_at : null,
        failureReason: typeof data.error_message === 'string' ? data.error_message : null,
        rawPayload: parsed,
      },
    };
  }
}
