import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const runtimeSessionSecret = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

export const envConfig = {
  port: Number(process.env.PORT || 3000),
  appEnv: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  sessionSecret: runtimeSessionSecret,
  supabaseUrl: process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '',
  paymentProvider: (process.env.PAYMENT_PROVIDER?.trim() || 'dodo_payments').toLowerCase(),
  defaultBillingCurrency: (process.env.DEFAULT_BILLING_CURRENCY?.trim() || 'USD').toUpperCase(),
  dodoEnv: (process.env.DODO_PAYMENTS_ENV?.trim() || 'test_mode').toLowerCase() === 'live_mode'
    ? 'live_mode'
    : 'test_mode',
  dodoApiKey: process.env.DODO_PAYMENTS_API_KEY?.trim() || '',
  dodoWebhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET?.trim() || '',
  dodoProductPlusMonthlyId: process.env.DODO_PRODUCT_PLUS_MONTHLY_ID?.trim() || '',
  dodoProductPlusAnnualId: process.env.DODO_PRODUCT_PLUS_ANNUAL_ID?.trim() || '',
  adminClaimPasscode: process.env.ADMIN_CLAIM_PASSCODE?.trim() || '',
} as const;

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    envConfig.supabaseUrl.startsWith('http') && envConfig.supabaseServiceRoleKey.length > 20
  );
}

export function isPaymentProviderConfigured(): boolean {
  return Boolean(
    envConfig.dodoApiKey.length > 0 &&
      envConfig.dodoWebhookSecret.length > 0 &&
      envConfig.dodoProductPlusMonthlyId.length > 0
  );
}

export function logStartupDiagnostics(): void {
  const status = {
    env: envConfig.appEnv,
    billingCurrency: envConfig.defaultBillingCurrency,
    paymentProvider: envConfig.paymentProvider,
    paymentGateway: isPaymentProviderConfigured() ? 'configured' : 'unconfigured_safe_mode',
    supabaseServer: isSupabaseServerConfigured() ? 'configured' : 'local_store_fallback',
  };
  console.log('[PLAYROOM] Server startup configuration:', JSON.stringify(status));
}
