
'use client';

import { useState } from 'react';
import { SubscriptionList } from '@/components/dashboard/SubscriptionList';
import { SubscriptionDrawer } from '@/components/forms/SubscriptionDrawer';
import { Plus, Search } from 'lucide-react';
import { DashboardSubscription } from '@/components/dashboard/DashboardClient';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface SubscriptionsClientProps {
  subscriptions: DashboardSubscription[];
  categories: Category[];
}

export function SubscriptionsClient({ subscriptions, categories }: SubscriptionsClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<DashboardSubscription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (sub: { id: string }) => {
    const fullSubscription = subscriptions.find((s) => s.id === sub.id) ?? null;
    setSelectedSubscription(fullSubscription);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubscription(null);
    setIsDrawerOpen(true);
  };

  const drawerSubscription = selectedSubscription ? {
    ...selectedSubscription,
    startDate: new Date(selectedSubscription.startDate),
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {subscriptions.length} total subscriptions
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={20} />
          New Subscription
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
        />
      </div>

      <SubscriptionList 
        subscriptions={filteredSubscriptions} 
        onEdit={handleEdit}
      />

      {/* Mobile FAB */}
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
