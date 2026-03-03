
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSubscriptionAction, updateSubscriptionAction, deleteSubscriptionAction } from '@/actions/subscription';
import { createSubscriptionSchema } from '@/lib/schemas';
import { useAction } from 'next-safe-action/hooks';
import { logger } from '@/lib/logger';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Extend schema for form to handle string inputs before coercion
const formSchema = createSubscriptionSchema.omit({ nextBillingDate: true }).extend({
  amount: z.string().min(1, 'Amount is required'), // User types "10.50"
  startDate: z.string().min(1, 'Date is required'), // HTML date input returns string
  categoryId: z.string().optional(), // Override to handle empty string in form
  isAutoRenew: z.boolean(), // Explicitly required for form handling
});

type FormData = z.infer<typeof formSchema>;

const CYCLES = ['Monthly', 'Yearly', 'Quarterly', 'Weekly'] as const;

export interface SubscriptionFormProps {
  categories?: { id: string; name: string; color?: string }[];
  subscription?: {
    id: string;
    name: string;
    amount: number;
    currencyCode: string;
    cycle: string;
    startDate: Date;
    categoryId?: string | null;
    isAutoRenew: boolean;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionForm({ 
  categories = [], 
  subscription,
  onSuccess,
  onCancel
}: SubscriptionFormProps) {
  const isEditMode = !!subscription;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyCode: 'MYR',
      cycle: 'Monthly',
      isAutoRenew: true,
    },
  });

  // Reset form when subscription changes
  useEffect(() => {
    if (subscription) {
      // Edit Mode: Pre-fill form
      reset({
        name: subscription.name,
        amount: (subscription.amount / 100).toFixed(2),
        currencyCode: subscription.currencyCode,
        cycle: (CYCLES as readonly string[]).includes(subscription.cycle)
          ? (subscription.cycle as FormData['cycle'])
          : 'Monthly',
        startDate: format(new Date(subscription.startDate), 'yyyy-MM-dd'),
        categoryId: subscription.categoryId || '',
        isAutoRenew: subscription.isAutoRenew,
      });
    } else {
      // Create Mode: Reset to defaults
      reset({
        name: '',
        amount: '',
        currencyCode: 'MYR',
        cycle: 'Monthly',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        categoryId: '',
        isAutoRenew: true,
      });
    }
  }, [subscription, reset]);

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createSubscriptionAction, {
    onSuccess: () => {
      onSuccess?.();
      reset();
    },
    onError: ({ error }) => {
      logger.error('Failed to create subscription', error);
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateSubscriptionAction, {
    onSuccess: () => {
      onSuccess?.();
      reset();
    },
    onError: ({ error }) => {
      logger.error('Failed to update subscription', error);
    },
  });

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteSubscriptionAction, {
    onSuccess: () => {
      onSuccess?.();
      reset();
    },
    onError: ({ error }) => {
      logger.error('Failed to delete subscription', error);
    },
  });

  const onSubmit = (data: FormData) => {
    const amountInCents = Math.round(parseFloat(data.amount) * 100);
    const payload = {
      ...data,
      amount: amountInCents,
      startDate: new Date(data.startDate),
    };

    if (isEditMode && subscription) {
      executeUpdate({
        id: subscription.id,
        ...payload,
      });
    } else {
      executeCreate(payload);
    }
  };

  const handleDelete = () => {
    if (subscription && confirm('Are you sure you want to delete this subscription?')) {
      executeDelete({ id: subscription.id });
    }
  };

  const isLoading = isCreating || isUpdating || isDeleting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Subscription' : 'New Subscription'}
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="p-2 bg-red-50 dark:bg-red-900/10 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 transition-colors active:scale-95"
              title="Delete Subscription"
            >
              <Trash2 size={20} />
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors active:scale-95"
              title="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Service Name
        </label>
        <input
          {...register('name')}
          id="name"
          placeholder="Netflix, Spotify, etc."
          className={cn(
            "w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black/20 outline-none transition-all text-gray-900 dark:text-white",
            errors.name && "border-red-500 bg-red-50 dark:bg-red-900/10"
          )}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Amount & Currency */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <input
            {...register('amount')}
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            className={cn(
              "w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black/20 outline-none transition-all text-gray-900 dark:text-white font-mono",
              errors.amount && "border-red-500"
            )}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Currency
          </label>
          <select
            {...register('currencyCode')}
            id="currency"
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent outline-none text-gray-900 dark:text-white"
          >
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
      </div>
      {errors.amount && <p className="text-xs text-red-500 -mt-4">{errors.amount.message}</p>}

      {/* Cycle */}
      <div className="space-y-2">
        <label htmlFor="cycle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Billing Cycle
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CYCLES.map((cycle) => (
            <label key={cycle} className="cursor-pointer">
              <input
                type="radio"
                value={cycle}
                {...register('cycle')}
                className="peer sr-only"
              />
              <div className="p-2 text-center text-xs font-medium rounded-lg bg-gray-50 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 border border-transparent peer-checked:bg-blue-600 peer-checked:text-white peer-checked:shadow-md transition-all">
                {cycle}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEditMode ? 'Next Bill Date' : 'First Bill Date'}
        </label>
        <input
          {...register('startDate')}
          id="startDate"
          type="date"
          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white"
        />
        {errors.startDate && (
          <p className="text-xs text-red-500">{errors.startDate.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Category (Optional)
        </label>
        <select
          {...register('categoryId')}
          id="category"
          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Auto Renew Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E]">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Renew</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            {...register('isAutoRenew')}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : (isEditMode ? 'Update Subscription' : 'Create Subscription')}
      </button>
    </form>
  );
}
