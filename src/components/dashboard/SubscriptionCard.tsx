'use client';

import { motion, Variants } from 'framer-motion';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { Calendar, Sparkles } from 'lucide-react';

interface SubscriptionCardProps {
  id: string;
  name: string;
  amount: number;
  currency: string;
  nextBillingDate?: Date | string;
  cycle: string;
  isUpcoming?: boolean;
  category?: string;
  logo?: string; // Optional logo URL or placeholder
  variants?: Variants;
  onClick?: () => void;
}

export function SubscriptionCard({
  name,
  amount,
  currency,
  nextBillingDate,
  cycle,
  isUpcoming,
  category,
  variants,
  onClick,
}: SubscriptionCardProps) {
  
  // Format cycle (Monthly -> /mo, Yearly -> /yr)
  const cycleLabel = cycle === 'Monthly' ? '/mo' : cycle === 'Yearly' ? '/yr' : `/${cycle}`;

  return (
    <motion.div
      layoutId={`card-${name}`} // Enable shared layout animation if needed
      onClick={onClick}
      variants={variants}
      whileTap={{ scale: 0.98 }}
      initial={variants ? undefined : { opacity: 0, y: 20 }}
      animate={variants ? undefined : { opacity: 1, y: 0 }}
      transition={variants ? undefined : { type: 'spring', stiffness: 260, damping: 20 }}
      className="relative w-full mb-4 group cursor-pointer"
    >
      {/* Blurred Shadow Effect */}
      <div className="absolute inset-0 bg-gray-200 dark:bg-black/40 rounded-2xl blur-md opacity-0 group-active:opacity-100 transition-opacity duration-300" />
      
      {/* Card Content */}
      <div className="relative bg-white dark:bg-[#2C2C2E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold text-gray-500 dark:text-gray-300">
            {name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {isUpcoming && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <Sparkles size={10} className="mr-1" />
                  Upcoming
                </span>
              )}
              {nextBillingDate && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar size={10} className="mr-1" />
                  {formatRelativeDate(new Date(nextBillingDate))}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(amount, currency)}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-0.5">
              {cycleLabel}
            </span>
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            {category || 'Uncategorized'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
