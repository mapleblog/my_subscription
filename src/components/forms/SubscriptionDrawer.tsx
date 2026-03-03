'use client';

import { useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSubscriptionAction, updateSubscriptionAction, deleteSubscriptionAction } from '@/actions/subscription';
import { createSubscriptionSchema } from '@/lib/schemas';
import { useAction } from 'next-safe-action/hooks';
import { logger } from '@/lib/logger';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Extend schema for form to handle string inputs before coercion
const formSchema = createSubscriptionSchema.extend({
  amount: z.string().min(1, 'Amount is required'), // User types "10.50"
  startDate: z.string().min(1, 'Date is required'), // HTML date input returns string
  categoryId: z.string().optional(), // Override to handle empty string in form
  isAutoRenew: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const CYCLES = ['Monthly', 'Yearly', 'Quarterly', 'Weekly'] as const;

interface SubscriptionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: { id: string; name: string }[];
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
}

export function SubscriptionDrawer({ 
  open, 
  onOpenChange, 
  categories = [], 
  subscription 
}: SubscriptionDrawerProps) {
  const isEditMode = !!subscription;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyCode: 'MYR',
      cycle: 'Monthly',
      isAutoRenew: true,
    },
  });

  // Reset form when subscription changes or drawer opens/closes
  useEffect(() => {
    if (open) {
      if (subscription) {
        // Edit Mode: Pre-fill form
        reset({
          name: subscription.name,
          amount: (subscription.amount / 100).toFixed(2),
          currencyCode: subscription.currencyCode,
          cycle: subscription.cycle as any,
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
    }
  }, [open, subscription, reset]);

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createSubscriptionAction, {
    onSuccess: () => {
      onOpenChange(false);
      reset();
    },
    onError: ({ error }) => {
      logger.error('Failed to create subscription', error);
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateSubscriptionAction, {
    onSuccess: () => {
      onOpenChange(false);
      reset();
    },
    onError: ({ error }) => {
      logger.error('Failed to update subscription', error);
    },
  });

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteSubscriptionAction, {
    onSuccess: () => {
      onOpenChange(false);
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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]" />
        <Drawer.Content className="bg-white dark:bg-[#1C1C1E] flex flex-col rounded-t-[10px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-8" />
            
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <Drawer.Title className="font-bold text-2xl text-gray-900 dark:text-white">
                  {isEditMode ? 'Edit Subscription' : 'New Subscription'}
                </Drawer.Title>
                <div className="flex items-center gap-2">
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="p-2 bg-red-50 dark:bg-red-900/10 rounded-full text-red-500 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <Drawer.Close asChild>
                    <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400">
                      <X size={20} />
                    </button>
                  </Drawer.Close>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : (isEditMode ? 'Update Subscription' : 'Add Subscription')}
                </button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
