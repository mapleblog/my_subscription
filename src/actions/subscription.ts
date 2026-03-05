'use server';

import { actionClient } from '@/lib/safe-action';
import { SubscriptionService } from '@/services/subscription.service';
import { checkRateLimit } from '@/lib/ratelimit';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { AppError } from '@/lib/errors';

import { createSubscriptionSchema, updateSubscriptionSchema, toggleAutoRenewSchema, deleteSubscriptionSchema } from '@/lib/schemas';
// Schemas are imported for server-side validation only
// Client components should import schemas directly from '@/lib/schemas'

const toPlain = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// --- Actions ---

export const createSubscriptionAction = actionClient
  .schema(createSubscriptionSchema)
  .action(async ({ parsedInput: data }) => {
    // Rate Limit Check
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(`create_sub:${ip}`);
    
    if (!isAllowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const sub = await SubscriptionService.createSubscription(data);
      revalidatePath('/dashboard');
      revalidatePath('/subscriptions');
      return { success: true, data: toPlain(sub) };
    } catch (error) {
      if (error instanceof AppError) {
        throw new Error(error.message); // Pass through known app errors
      }
      throw error;
    }
  });

export const updateSubscriptionAction = actionClient
  .schema(updateSubscriptionSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    // Rate Limit Check
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(`update_sub:${ip}`);
    
    if (!isAllowed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const sub = await SubscriptionService.updateSubscription(id, data);
      revalidatePath('/dashboard');
      revalidatePath('/subscriptions');
      revalidatePath(`/subscriptions/${id}`);
      return { success: true, data: toPlain(sub) };
    } catch (error) {
      if (error instanceof AppError) {
        throw new Error(error.message);
      }
      throw error;
    }
  });

export const toggleAutoRenewAction = actionClient
  .schema(toggleAutoRenewSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      const sub = await SubscriptionService.toggleAutoRenew(id);
      revalidatePath('/dashboard');
      revalidatePath('/subscriptions');
      revalidatePath(`/subscriptions/${id}`);
      return { success: true, data: toPlain(sub) };
    } catch (error) {
      if (error instanceof AppError) {
        throw new Error(error.message);
      }
      throw error;
    }
  });

export const deleteSubscriptionAction = actionClient
  .schema(deleteSubscriptionSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      await SubscriptionService.deleteSubscription(id);
      revalidatePath('/dashboard');
      revalidatePath('/subscriptions');
      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw new Error(error.message);
      }
      throw error;
    }
  });
