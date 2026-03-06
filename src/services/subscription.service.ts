import 'server-only';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ExchangeService } from './exchange';
import { AppError, AppErrors } from '../lib/errors';
import { logger } from '../lib/logger';

export interface SubscriptionData {
  name: string;
  amount: number; // in cents
  currencyCode: string;
  cycle: string;
  startDate: Date;
  nextBillingDate?: Date;
  paymentMethod?: string;
  categoryId?: string;
  isAutoRenew: boolean;
}

function slugifyCategoryName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const slug = trimmed
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return slug || 'category';
}

async function generateUniqueCategorySlug(base: string): Promise<string> {
  const baseSlug = base.slice(0, 50) || 'category';
  const existingBase = await prisma.category.findUnique({ where: { slug: baseSlug } });
  if (!existingBase) return baseSlug;

  for (let i = 2; i <= 50; i += 1) {
    const candidate = `${baseSlug}-${i}`.slice(0, 50);
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${baseSlug}-${suffix}`.slice(0, 50);
}

function calculateNextBillingDate(startDate: Date, cycle: string): Date {
  const nextDate = new Date(startDate);
  switch (cycle) {
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    default:
      // Default to Monthly if unknown cycle
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
}

export const SubscriptionService = {
  /**
   * Get all subscriptions (decrypted automatically by Prisma extension)
   */
  getSubscriptions: async () => {
    return await prisma.subscription.findMany({
      orderBy: { nextBillingDate: 'asc' },
      include: {
        category: true,
        currency: true,
      },
    });
  },

  /**
   * Get a single subscription by ID
   */
  getSubscription: async (id: string) => {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        category: true,
        currency: true,
      },
    });

    if (!sub) {
      throw new AppError(AppErrors.NOT_FOUND, `Subscription with ID ${id} not found`);
    }

    return sub;
  },

  /**
   * Get dashboard summary (Total Monthly Spend)
   */
  getDashboardSummary: async (preferredCurrencyCode = 'MYR') => {
    // Validate preferred currency
    const currency = await prisma.currency.findUnique({ where: { code: preferredCurrencyCode } });
    if (!currency) {
      logger.warn('getDashboardSummary', `Preferred currency ${preferredCurrencyCode} not found, defaulting to MYR`);
      preferredCurrencyCode = 'MYR';
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { isActive: true },
      include: { currency: true },
    });

    let totalMonthlyCost = 0; // in cents

    for (const sub of subscriptions) {
      const amount = Number(sub.amount);
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      let convertedAmount = safeAmount;
      try {
        convertedAmount = await ExchangeService.convert(safeAmount, sub.currency.code, preferredCurrencyCode);
      } catch (error) {
        logger.warn(
          'getDashboardSummary',
          'Currency conversion failed, falling back to unconverted amount',
          { subscriptionId: sub.id, from: sub.currency.code, to: preferredCurrencyCode },
          error
        );
      }

      // 2. Normalize to Monthly (result may be float)
      let monthlyAmount = convertedAmount;
      switch (sub.cycle) {
        case 'Yearly':
          monthlyAmount = convertedAmount / 12;
          break;
        case 'Quarterly':
          monthlyAmount = convertedAmount / 3;
          break;
        case 'Weekly':
          monthlyAmount = convertedAmount * 4.33; // Average weeks in a month
          break;
        case 'Monthly':
        default:
          // already monthly
          break;
      }
      
      totalMonthlyCost += monthlyAmount;
    }

    return {
      totalMonthlyCost: Math.round(totalMonthlyCost), // Round to nearest cent
      currencyCode: preferredCurrencyCode,
      activeCount: subscriptions.length,
    };
  },

  /**
   * Get all categories
   */
  getCategories: async () => {
    return await prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  /**
   * Update category color
   */
  updateCategoryColor: async (id: string, color: string) => {
    const hex = color.trim();
    if (!/^#([0-9a-fA-F]{6})$/.test(hex)) {
      throw new AppError(AppErrors.INVALID_INPUT, 'Invalid category color');
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(AppErrors.INVALID_CATEGORY, `Category ID ${id} not found`);
    }

    return await prisma.category.update({
      where: { id },
      data: { color: hex },
    });
  },

  /**
   * Create a new category
   */
  createCategory: async (data: { name: string; color?: string; icon?: string }) => {
    const name = data.name.trim();
    if (!name) {
      throw new AppError(AppErrors.INVALID_INPUT, 'Category name is required');
    }

    const existingByName = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existingByName) {
      throw new AppError(AppErrors.DUPLICATE_ENTRY, 'Category already exists');
    }

    const color = (data.color || '#6366F1').trim();
    if (!/^#([0-9a-fA-F]{6})$/.test(color)) {
      throw new AppError(AppErrors.INVALID_INPUT, 'Invalid category color');
    }

    const slug = await generateUniqueCategorySlug(slugifyCategoryName(name));
    const icon = (data.icon || 'tag').trim() || 'tag';

    return await prisma.category.create({
      data: {
        name,
        slug,
        icon,
        color,
      },
    });
  },

  /**
   * Create a new subscription
   * Validates input and encrypts data (via Prisma extension)
   */
  createSubscription: async (data: SubscriptionData) => {
    // 1. Validate Currency
    const currency = await prisma.currency.findUnique({
      where: { code: data.currencyCode },
    });
    if (!currency) {
      throw new AppError(AppErrors.INVALID_CURRENCY, `Currency ${data.currencyCode} not supported`);
    }

    // 2. Validate Category (if provided)
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new AppError(AppErrors.INVALID_CATEGORY, `Category ID ${data.categoryId} not found`);
      }
    }

    // 3. Validate Amount
    if (data.amount < 0) {
      throw new AppError(AppErrors.INVALID_INPUT, 'Amount must be positive');
    }

    return await prisma.subscription.create({
      data: {
        ...data,
        // Calculate next billing date if not provided
        nextBillingDate: data.nextBillingDate || calculateNextBillingDate(data.startDate, data.cycle),
        amount: String(data.amount), // Prisma extension expects string for encryption
      },
    });
  },

  /**
   * Update a subscription
   */
  updateSubscription: async (id: string, data: Partial<SubscriptionData>) => {
    // Check existence first
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(AppErrors.NOT_FOUND, `Subscription with ID ${id} not found`);
    }

    const updateData: Prisma.SubscriptionUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) {
      if (data.amount < 0) {
        throw new AppError(AppErrors.INVALID_INPUT, 'Amount must be positive');
      }
      updateData.amount = String(data.amount);
    }
    if (data.currencyCode !== undefined) updateData.currencyCode = data.currencyCode;
    if (data.cycle !== undefined) updateData.cycle = data.cycle;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.nextBillingDate !== undefined) updateData.nextBillingDate = data.nextBillingDate;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.isAutoRenew !== undefined) updateData.isAutoRenew = data.isAutoRenew;

    if (data.currencyCode) {
      const currency = await prisma.currency.findUnique({ where: { code: data.currencyCode } });
      if (!currency) {
        throw new AppError(AppErrors.INVALID_CURRENCY, `Currency ${data.currencyCode} not supported`);
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw new AppError(AppErrors.INVALID_CATEGORY, `Category ID ${data.categoryId} not found`);
      }
    }

    return await prisma.subscription.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Toggle Auto-Renew status
   */
  toggleAutoRenew: async (id: string) => {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new AppError(AppErrors.NOT_FOUND, `Subscription with ID ${id} not found`);
    }

    return await prisma.subscription.update({
      where: { id },
      data: { isAutoRenew: !sub.isAutoRenew },
    });
  },

  /**
   * Delete a subscription
   */
  deleteSubscription: async (id: string) => {
    try {
      return await prisma.subscription.delete({
        where: { id },
      });
    } catch (error) {
      // Prisma P2025: Record to delete does not exist
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2025') {
        // Idempotent delete: if not found, consider it deleted.
        // This handles cases where the UI might be stale (e.g. after a DB reset).
        return null;
      }
      // Log unexpected errors
      logger.error('deleteSubscription', error);
      throw error;
    }
  },
};
