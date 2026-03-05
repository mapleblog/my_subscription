
'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { SubscriptionCard } from './SubscriptionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { DashboardSubscription } from './DashboardClient';

interface CategoryGroupListProps {
  subscriptions: DashboardSubscription[];
  categories: { id: string; name: string; color?: string }[];
  isLoading?: boolean;
  onEdit?: (subscription: DashboardSubscription) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function CategoryGroupList({ subscriptions, categories, isLoading, onEdit }: CategoryGroupListProps) {
  const groupsToRender = useMemo(() => {
    const groupedSubs: Record<string, DashboardSubscription[]> = {};
    const categoryNames: Record<string, string> = {};
    categories.forEach(cat => {
      groupedSubs[cat.id] = [];
      categoryNames[cat.id] = cat.name;
    });
    groupedSubs['uncategorized'] = [];
    categoryNames['uncategorized'] = 'Uncategorized';
    subscriptions.forEach(sub => {
      if (sub.categoryId && groupedSubs[sub.categoryId]) {
        groupedSubs[sub.categoryId].push(sub);
      } else {
        groupedSubs['uncategorized'].push(sub);
      }
    });
    return Object.entries(groupedSubs)
      .filter(([, subs]) => subs.length > 0)
      .map(([catId, subs]) => ({
        id: catId,
        name: categoryNames[catId],
        subscriptions: subs,
        totalAmount: subs.reduce((sum, sub) => sum + sub.amount, 0),
        currencyCode: subs[0]?.currencyCode || 'MYR',
      }));
  }, [subscriptions, categories]);
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Clarity starts here
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-2">
          Add your first subscription to track your spending and upcoming bills.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-10">
      {groupsToRender.map((group) => (
        <section key={group.id} className="space-y-4">
          <div className="flex items-end justify-between border-b border-gray-100 dark:border-white/5 pb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {group.name}
              <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {group.subscriptions.length}
              </span>
            </h3>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <span className="text-xs mr-1">{group.currencyCode}</span>
              {(group.totalAmount / 100).toFixed(2)}
            </div>
          </div>
          
          <motion.div
            layout="position"
            variants={container}
            initial={false}
            animate="show"
            transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
          >
            {group.subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                id={sub.id}
                name={sub.name}
                amount={sub.amount}
                currency={sub.currency.code}
                cycle={sub.cycle}
                nextBillingDate={sub.nextBillingDate}
                isUpcoming={sub.isUpcoming}
                category={sub.category?.name}
                categoryColor={sub.category?.color}
                variants={item}
                onClick={() => onEdit?.(sub)}
              />
            ))}
          </motion.div>
        </section>
      ))}
    </div>
  );
}
