import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().int().min(0, 'Amount must be positive'), // in cents
  currencyCode: z.string().length(3, 'Currency code must be 3 characters').toUpperCase(),
  cycle: z.enum(['Monthly', 'Yearly', 'Quarterly', 'Weekly']),
  startDate: z.coerce.date(),
  nextBillingDate: z.coerce.date().optional(),
  categoryId: z.string().optional().transform(e => e === "" ? undefined : e),
  isAutoRenew: z.boolean().default(true),
  paymentMethod: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex value like #6366F1')
    .optional(),
  icon: z.string().trim().min(1).max(50).optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  id: z.string().cuid(),
});

export const toggleAutoRenewSchema = z.object({
  id: z.string().cuid(),
});

export const deleteSubscriptionSchema = z.object({
  id: z.string().cuid(),
});

export const updateCategoryColorSchema = z.object({
  id: z.string().cuid(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex value like #6366F1'),
});
