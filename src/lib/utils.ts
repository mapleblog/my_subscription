import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency: string = 'MYR'): string {
  // Use 'en-US' locale for USD to get '$' instead of 'US$' which is typical in 'en-MY' locale
  // For other currencies, stick to 'en-MY' or use 'narrowSymbol' if supported
  const locale = currency === 'USD' ? 'en-US' : 'en-MY';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    currencyDisplay: 'narrowSymbol', // Try to force narrow symbol ($ instead of US$)
  }).format(cents / 100);
}

export function formatCurrencyParts(
  cents: number,
  currency: string = 'MYR'
): { symbol: string; integer: string; fraction: string; formatted: string } {
  const locale = currency === 'USD' ? 'en-US' : 'en-MY';
  const nf = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    currencyDisplay: 'narrowSymbol',
  });
  const parts = nf.formatToParts(cents / 100);

  let symbol = '';
  let integer = '';
  let fraction = '';

  for (const p of parts) {
    if (p.type === 'currency') symbol = p.value;
    if (p.type === 'integer' || p.type === 'group') integer += p.value;
    if (p.type === 'fraction') fraction = p.value;
  }

  return {
    symbol,
    integer,
    fraction: fraction || '00',
    formatted: nf.format(cents / 100),
  };
}

export function formatRelativeDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Simple relative date formatter (Today, Tomorrow, or MMM dd)
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7 && days > 0) return `In ${days} days`;
  
  return new Intl.DateTimeFormat('en-MY', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
