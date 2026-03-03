import { SubscriptionService } from '@/services/subscription.service';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { SubscriptionList } from '@/components/dashboard/SubscriptionList';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function DashboardContent() {
  let loadError: Error | null = null;
  let summary = { totalMonthlyCost: 0, currencyCode: 'MYR', activeCount: 0 };
  let subscriptions: Awaited<ReturnType<typeof SubscriptionService.getSubscriptions>> = [];
  let categories: Awaited<ReturnType<typeof SubscriptionService.getCategories>> = [];

  try {
    [summary, subscriptions, categories] = await Promise.all([
      SubscriptionService.getDashboardSummary(),
      SubscriptionService.getSubscriptions(),
      SubscriptionService.getCategories(),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('DashboardContent Error:', errorMessage);
    loadError = error instanceof Error ? error : new Error('Failed to load dashboard');
  }

  if (loadError) {
    return (
      <div className="p-4 text-center">
        <h3 className="text-red-500 font-bold">Failed to load dashboard</h3>
        <p className="text-sm text-gray-500">{loadError.message}</p>
      </div>
    );
  }

  // Serialize subscriptions strictly to avoid "Date object" warning/error and type mismatches
  const serializedSubscriptions = subscriptions.map(sub => {
    // Ensure all fields are safe primitives
    return {
      id: sub.id,
      name: sub.name,
      amount: Number(sub.amount), // Convert string amount to number
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
    };
  });
  
  // Pick only needed fields to avoid serialization issues
  const simpleCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color
  }));

  return (
    <DashboardClient 
      summary={summary}
      subscriptions={serializedSubscriptions}
      categories={simpleCategories}
    />
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="w-full h-48 bg-gray-200 dark:bg-[#2C2C2E] rounded-3xl mb-6 animate-pulse" />
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-[#2C2C2E] rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-[#2C2C2E] rounded animate-pulse" />
      </div>
      <SubscriptionList subscriptions={[]} isLoading={true} />
    </>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen px-6 py-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
