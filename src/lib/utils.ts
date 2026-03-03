import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency: string = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
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
