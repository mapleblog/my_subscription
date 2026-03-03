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

export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  id: z.string().cuid(),
});

export const toggleAutoRenewSchema = z.object({
  id: z.string().cuid(),
});

export const deleteSubscriptionSchema = z.object({
  id: z.string().cuid(),
});
