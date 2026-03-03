'use client';

import { useState } from 'react';
import { SpendDisplay } from '@/components/dashboard/SpendDisplay';
import { SubscriptionList } from '@/components/dashboard/SubscriptionList';
import { SubscriptionDrawer } from '@/components/forms/SubscriptionDrawer';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Currency {
  code: string;
  symbol: string;
}

export interface DashboardSubscription {
  id: string;
  name: string;
  amount: number;
  currencyCode: string;
  currency: Currency;
  cycle: string;
  startDate: string | Date;
  nextBillingDate: string | Date;
  isAutoRenew: boolean;
  categoryId?: string | null;
  category?: Category | null;
  isUpcoming: boolean;
  paymentMethod?: string | null;
  isActive?: boolean;
}

interface DashboardClientProps {
  summary: {
    totalMonthlyCost: number;
    currencyCode: string;
    activeCount: number;
  };
  subscriptions: DashboardSubscription[];
  categories: Category[];
}

export function DashboardClient({ summary, subscriptions, categories }: DashboardClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<DashboardSubscription | null>(null);

  // Handle edit request from list
  const handleEdit = (sub: any) => {
    // sub comes from SubscriptionList which uses a compatible but slightly different interface
    // We can safely cast it and set it
    setSelectedSubscription(sub);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubscription(null);
    setIsDrawerOpen(true);
  };

  // Prepare subscription for drawer (convert string dates to Date objects if needed)
  // This ensures that the drawer always receives a Date object for startDate
  const drawerSubscription = selectedSubscription ? {
    ...selectedSubscription,
    startDate: new Date(selectedSubscription.startDate),
  } : null;

  return (
    <>
      <SpendDisplay 
        totalAmount={summary.totalMonthlyCost} 
        currency={summary.currencyCode} 
      />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Your Subscriptions
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {summary.activeCount} Active
        </span>
      </div>

      <SubscriptionList 
        subscriptions={subscriptions} 
        onEdit={handleEdit}
      />
      
      {/* Floating Action Button */}
      <button 
        onClick={handleCreate}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-40"
        aria-label="Add Subscription"
      >
        <Plus size={28} />
      </button>

      <SubscriptionDrawer 
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        categories={categories}
        subscription={drawerSubscription}
      />
    </>
  );
}
