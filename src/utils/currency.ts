import type { Language } from '../types/playroom.ts';

/**
 * Formats integer cents into a USD string without floating-point arithmetic.
 * Examples:
 *  - 0 -> "$0" (when compactZero=true) or "$0.00"
 *  - 499 -> "$4.99"
 *  - 3999 -> "$39.99"
 */
export function formatUsdCents(
  cents: number,
  options?: { compactZero?: boolean; locale?: Language }
): string {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  if (safeCents === 0 && options?.compactZero) {
    return '$0';
  }
  const sign = safeCents < 0 ? '-' : '';
  const abs = Math.abs(safeCents);
  const wholeDollars = Math.floor(abs / 100);
  const remCents = abs % 100;
  const formattedWhole = wholeDollars.toLocaleString(options?.locale === 'fr' ? 'fr-FR' : 'en-US');
  return `${sign}$${formattedWhole}.${String(remCents).padStart(2, '0')}`;
}

export function formatMoneyCents(
  cents: number,
  currency = 'USD',
  options?: { compactZero?: boolean; locale?: Language }
): string {
  if (currency.toUpperCase() === 'USD') {
    return formatUsdCents(cents, options);
  }
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  const sign = safeCents < 0 ? '-' : '';
  const abs = Math.abs(safeCents);
  const whole = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}${whole}.${String(rem).padStart(2, '0')} ${currency.toUpperCase()}`;
}
