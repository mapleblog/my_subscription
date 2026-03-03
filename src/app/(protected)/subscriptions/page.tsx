import { SubscriptionService } from '@/services/subscription.service';
import { SubscriptionsClient } from '@/components/subscriptions/SubscriptionsClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function SubscriptionsContent() {
  let loadError: Error | null = null;
  let subscriptions: Awaited<ReturnType<typeof SubscriptionService.getSubscriptions>> = [];
  let categories: Awaited<ReturnType<typeof SubscriptionService.getCategories>> = [];

  try {
    [subscriptions, categories] = await Promise.all([
      SubscriptionService.getSubscriptions(),
      SubscriptionService.getCategories(),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`SubscriptionsContent Error: ${errorMessage}`);
    loadError = error instanceof Error ? error : new Error('Failed to load subscriptions');
  }

  if (loadError) {
    return (
      <div className="p-4 text-center">
        <h3 className="text-red-500 font-bold">Failed to load subscriptions</h3>
        <p className="text-sm text-gray-500">{loadError.message}</p>
      </div>
    );
  }

  const serializedSubscriptions = subscriptions.map(sub => ({
    id: sub.id,
    name: sub.name,
    amount: Number(sub.amount),
    currencyCode: sub.currencyCode,
    cycle: sub.cycle,
    startDate: sub.startDate.toISOString(),
    nextBillingDate: sub.nextBillingDate.toISOString(),
    paymentMethod: sub.paymentMethod || null,
    isAutoRenew: sub.isAutoRenew,
    isUpcoming: sub.isUpcoming,
    categoryId: sub.categoryId || null,
    isActive: sub.isActive,
    category: sub.category ? {
      id: sub.category.id,
      name: sub.category.name,
      color: sub.category.color,
    } : null,
    currency: {
      code: sub.currency.code,
      symbol: sub.currency.symbol,
    },
  }));
  
  const simpleCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color
  }));

  return (
    <SubscriptionsClient 
      subscriptions={serializedSubscriptions}
      categories={simpleCategories}
    />
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-[#2C2C2E] rounded" />
      <div className="h-12 w-full bg-gray-200 dark:bg-[#2C2C2E] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-[#2C2C2E] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen px-6 py-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
      <Suspense fallback={<SubscriptionsSkeleton />}>
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}
