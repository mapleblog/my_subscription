'use client';

import { motion } from 'framer-motion';
import { SubscriptionCard } from './SubscriptionCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: { code: string };
  cycle: string;
  nextBillingDate: Date | string;
  isUpcoming: boolean;
  category?: { name: string } | null;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
  onEdit?: (subscription: Subscription) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function SubscriptionList({ subscriptions, isLoading, onEdit }: SubscriptionListProps) {
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-24 md:pb-0 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6"
    >
      {subscriptions.map((sub) => (
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
          variants={item}
          onClick={() => onEdit?.(sub)}
        />
      ))}
    </motion.div>
  );
}
