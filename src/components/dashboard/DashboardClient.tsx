'use client';

import { useEffect, useState } from 'react';
import { SpendDisplay } from '@/components/dashboard/SpendDisplay';
import { SubscriptionList } from '@/components/dashboard/SubscriptionList';
import { CategoryGroupList } from '@/components/dashboard/CategoryGroupList';
import { SubscriptionDrawer } from '@/components/forms/SubscriptionDrawer';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color?: string;
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
  const [categoriesState, setCategoriesState] = useState<Category[]>(categories);

  useEffect(() => {
    setCategoriesState(categories);
  }, [categories]);

  // Handle edit request from list
  const handleEdit = (sub: { id: string }) => {
    const fullSubscription = subscriptions.find((s) => s.id === sub.id) ?? null;
    setSelectedSubscription(fullSubscription);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubscription(null);
    setIsDrawerOpen(true);
  };

  const handleCategoryCreated = (category: Category) => {
    setCategoriesState((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev;
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleCategoryUpdated = (category: Category) => {
    setCategoriesState((prev) => {
      const next = prev.map((c) => (c.id === category.id ? { ...c, color: category.color } : c));
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  // Prepare subscription for drawer (convert string dates to Date objects if needed)
  // This ensures that the drawer always receives a Date object for startDate
  const drawerSubscription = selectedSubscription ? {
    ...selectedSubscription,
    startDate: new Date(selectedSubscription.startDate),
    nextBillingDate: new Date(selectedSubscription.nextBillingDate),
  } : null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Manage your subscriptions and expenses</p>
        </div>
        <div className="relative group">
          <div
            className="pointer-events-none absolute -inset-0.5 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 animate-spin-slow"
            style={{
              background:
                'conic-gradient(from 0deg, #60A5FA, #A855F7, #F472B6, #22D3EE, #60A5FA)',
            }}
          />
          <button
            onClick={handleCreate}
            className="relative inline-flex items-center justify-center w-10 h-10 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Add Subscription"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Summary Section */}
        <div className="space-y-6">
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
        <div>
          {/* Desktop List Header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
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
              categories={categoriesState}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <div
          className="relative group w-14 h-14"
        >
          <div
            className="pointer-events-none absolute -inset-1 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition duration-500 animate-spin-slow"
            style={{
              background:
                'conic-gradient(from 0deg, #60A5FA, #A855F7, #F472B6, #22D3EE, #60A5FA)',
            }}
          />
          <button
            onClick={handleCreate}
            className="relative w-14 h-14 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Add Subscription"
          >
            <Plus size={28} />
          </button>
        </div>
      </div>

      <SubscriptionDrawer 
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        categories={categoriesState}
        onCategoryCreated={handleCategoryCreated}
        onCategoryUpdated={handleCategoryUpdated}
        subscription={drawerSubscription}
      />
    </div>
  );
}
