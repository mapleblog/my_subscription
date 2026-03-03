'use client';

import { useState } from 'react';
import { SpendDisplay } from '@/components/dashboard/SpendDisplay';
import { SubscriptionList } from '@/components/dashboard/SubscriptionList';
import { CategoryGroupList } from '@/components/dashboard/CategoryGroupList';
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
    <div className="space-y-6 md:space-y-8">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscriptions and expenses</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={20} />
          New Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Summary Section */}
        <div className="md:col-span-1 space-y-6">
          <SpendDisplay 
            totalAmount={summary.totalMonthlyCost} 
            currency={summary.currencyCode} 
          />
          
          {/* Mobile List Header */}
          <div className="flex md:hidden items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Your Subscriptions
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {summary.activeCount} Active
            </span>
          </div>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          {/* Desktop List Header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              All Subscriptions
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10">
              {summary.activeCount} Active
            </span>
          </div>

          <div className="md:hidden">
            <SubscriptionList 
              subscriptions={subscriptions} 
              onEdit={handleEdit}
            />
          </div>
          
          <div className="hidden md:block">
            <CategoryGroupList 
              subscriptions={subscriptions} 
              categories={categories}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button */}
      <button 
        onClick={handleCreate}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-40"
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
    </div>
  );
}
