
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCategoryAction, updateCategoryColorAction, createSubscriptionAction, updateSubscriptionAction, deleteSubscriptionAction } from '@/actions/subscription';
import { createSubscriptionSchema } from '@/lib/schemas';
import { useAction } from 'next-safe-action/hooks';
import { logger } from '@/lib/logger';
import { Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useExchangeRates } from '@/hooks/use-exchange-rates';

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
  onCategoryCreated?: (category: { id: string; name: string; color?: string }) => void;
  onCategoryUpdated?: (category: { id: string; name: string; color?: string }) => void;
  subscription?: {
    id: string;
    name: string;
    amount: number;
    currencyCode: string;
    cycle: string;
    startDate: Date;
    nextBillingDate?: Date;
    categoryId?: string | null;
    isAutoRenew: boolean;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionForm({ 
  categories = [], 
  onCategoryCreated,
  onCategoryUpdated,
  subscription,
  onSuccess,
  onCancel
}: SubscriptionFormProps) {
  const isEditMode = !!subscription;
  const categoriesForSelect = categories.slice().sort((a, b) => a.name.localeCompare(b.name));
  const lastCategoryIdRef = useRef<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  const { rates, convert, isLoading: isLoadingRates, error: ratesError } = useExchangeRates();
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366F1');
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
  const [isEditColorOpen, setIsEditColorOpen] = useState(false);
  const [editColorValue, setEditColorValue] = useState('#6366F1');
  const [editColorError, setEditColorError] = useState<string | null>(null);

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currencyCode');

  useEffect(() => {
    if (!watchedAmount || !watchedCurrency || watchedCurrency === 'MYR') {
      setConvertedAmount(null);
      return;
    }

    const amount = parseFloat(watchedAmount);
    if (isNaN(amount)) {
      setConvertedAmount(null);
      return;
    }

    if (rates) {
      const result = convert(amount, watchedCurrency, 'MYR');
      if (result !== null) {
        setConvertedAmount(result.toFixed(2));
      } else {
        setConvertedAmount(null);
      }
    }
  }, [watchedAmount, watchedCurrency, rates, convert]);


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
        startDate: format(new Date(subscription.nextBillingDate ?? subscription.startDate), 'yyyy-MM-dd'),
        categoryId: subscription.categoryId || '',
        isAutoRenew: subscription.isAutoRenew,
      });
      lastCategoryIdRef.current = subscription.categoryId || '';
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
      lastCategoryIdRef.current = '';
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

  const { execute: executeCreateCategory, isExecuting: isCreatingCategory } = useAction(createCategoryAction, {
    onSuccess: ({ data }) => {
      const created = data?.data as unknown as { id: string; name: string; color?: string } | undefined;
      if (!created) return;
      onCategoryCreated?.({ id: created.id, name: created.name, color: created.color });
      setValue('categoryId', created.id, { shouldValidate: true, shouldDirty: true });
      setIsAddCategoryOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6366F1');
      setCreateCategoryError(null);
    },
    onError: ({ error }) => {
      const message = error?.serverError?.message || 'Failed to create category';
      setCreateCategoryError(message);
    },
  });

  const { execute: executeUpdateCategoryColor, isExecuting: isUpdatingCategoryColor } = useAction(updateCategoryColorAction, {
    onSuccess: ({ data }) => {
      const updated = data?.data as unknown as { id: string; name: string; color?: string } | undefined;
      if (!updated) return;
      onCategoryUpdated?.({ id: updated.id, name: updated.name, color: updated.color });
      setIsEditColorOpen(false);
      setEditColorError(null);
    },
    onError: ({ error }) => {
      const message = error?.serverError?.message || 'Failed to update color';
      setEditColorError(message);
    },
  });

  const onSubmit = (data: FormData) => {
    const amountInCents = Math.round(parseFloat(data.amount) * 100);
    const base = { ...data, amount: amountInCents };

    if (isEditMode && subscription) {
      const payloadEdit: Partial<typeof base> & { nextBillingDate: Date } = {
        ...base,
        nextBillingDate: new Date(data.startDate),
      };
      delete (payloadEdit as Record<string, unknown>).startDate;
      executeUpdate({ id: subscription.id, ...payloadEdit });
    } else {
      const payloadCreate = {
        ...base,
        startDate: new Date(data.startDate),
      };
      executeCreate(payloadCreate);
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

      {/* Converted Amount Display */}
      {watchedCurrency !== 'MYR' && watchedAmount && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <RefreshCw size={16} className={cn("transition-all", isLoadingRates && "animate-spin")} />
            <span>Estimated in MYR:</span>
          </div>
          <div className="font-mono font-bold text-blue-800 dark:text-blue-200">
            {isLoadingRates ? (
              <span className="opacity-50">Converting...</span>
            ) : ratesError ? (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle size={14} />
                <span>Rate Unavailable</span>
              </div>
            ) : convertedAmount ? (
              `RM ${convertedAmount}`
            ) : (
              '---'
            )}
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-3">
          <select
            {...register('categoryId', {
              onChange: (e) => {
                const v = (e.target as HTMLSelectElement).value;
                if (v === '__add_category__') {
                  setCreateCategoryError(null);
                  setNewCategoryName('');
                  setNewCategoryColor('#6366F1');
                  setIsAddCategoryOpen(true);
                  setValue('categoryId', lastCategoryIdRef.current, { shouldDirty: false });
                  return;
                }
                lastCategoryIdRef.current = v;
                if (v && v !== '') {
                  const selected = categoriesForSelect.find(c => c.id === v);
                  const col = selected?.color || '#6366F1';
                  setEditColorValue(col);
                }
              },
            })}
            id="category"
            className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white"
          >
            <option value="">Select a category</option>
            {categoriesForSelect.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option value="__add_category__">+ Add category</option>
          </select>
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            onClick={() => {
              const v = lastCategoryIdRef.current;
              if (!v) return;
              const selected = categoriesForSelect.find(c => c.id === v);
              const col = selected?.color || '#6366F1';
              setEditColorValue(col);
              setEditColorError(null);
              setIsEditColorOpen(true);
            }}
            disabled={!lastCategoryIdRef.current}
            aria-label="Edit color"
          >
            Edit color
          </button>
        </div>
      </div>

      {isEditColorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isUpdatingCategoryColor) setIsEditColorOpen(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit color</h3>
                <button
                  type="button"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 active:scale-95"
                  onClick={() => {
                    if (!isUpdatingCategoryColor) setIsEditColorOpen(false);
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="editColor">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="editColor"
                    type="color"
                    value={editColorValue}
                    onChange={(e) => setEditColorValue(e.target.value)}
                    className="h-10 w-12 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent"
                  />
                  <input
                    value={editColorValue}
                    onChange={(e) => setEditColorValue(e.target.value)}
                    className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white font-mono"
                    placeholder="#6366F1"
                  />
                  <div
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-white/10"
                    style={{ backgroundColor: /^#([0-9a-fA-F]{6})$/.test(editColorValue) ? editColorValue : '#6366F1' }}
                    aria-label="Color preview"
                  />
                </div>
              </div>

              {editColorError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                  {editColorError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
                  onClick={() => {
                    if (!isUpdatingCategoryColor) setIsEditColorOpen(false);
                  }}
                  disabled={isUpdatingCategoryColor}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isUpdatingCategoryColor || !/^#([0-9a-fA-F]{6})$/.test(editColorValue)}
                  onClick={() => {
                    setEditColorError(null);
                    const id = lastCategoryIdRef.current;
                    if (!id) return;
                    executeUpdateCategoryColor({ id, color: editColorValue });
                  }}
                >
                  {isUpdatingCategoryColor ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isCreatingCategory) setIsAddCategoryOpen(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add category</h3>
                <button
                  type="button"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 active:scale-95"
                  onClick={() => {
                    if (!isCreatingCategory) setIsAddCategoryOpen(false);
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="newCategoryName">
                  Category name
                </label>
                <input
                  id="newCategoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Streaming"
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="newCategoryColor">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="newCategoryColor"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-10 w-12 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent"
                  />
                  <input
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 outline-none text-gray-900 dark:text-white font-mono"
                    placeholder="#6366F1"
                  />
                  <div
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-white/10"
                    style={{ backgroundColor: /^#([0-9a-fA-F]{6})$/.test(newCategoryColor) ? newCategoryColor : '#6366F1' }}
                    aria-label="Color preview"
                  />
                </div>
              </div>

              {createCategoryError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                  {createCategoryError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
                  onClick={() => {
                    if (!isCreatingCategory) setIsAddCategoryOpen(false);
                  }}
                  disabled={isCreatingCategory}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isCreatingCategory || newCategoryName.trim().length === 0}
                  onClick={() => {
                    setCreateCategoryError(null);
                    executeCreateCategory({ name: newCategoryName.trim(), color: newCategoryColor });
                  }}
                >
                  {isCreatingCategory ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
