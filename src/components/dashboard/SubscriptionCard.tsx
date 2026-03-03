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
      className="relative w-full group cursor-pointer"
    >
      {/* Blurred Shadow Effect */}
      <div className="absolute inset-0 bg-gray-200 dark:bg-black/40 rounded-2xl blur-md opacity-0 group-active:opacity-100 transition-opacity duration-300" />
      
      {/* Card Content */}
      <div className="relative bg-white dark:bg-[#2C2C2E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo Placeholder */}
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-300">
            {name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 truncate">
              {isUpcoming && (
                <span className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <Sparkles size={8} className="mr-1" />
                  Soon
                </span>
              )}
              {nextBillingDate && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center truncate">
                  <Calendar size={10} className="mr-1 shrink-0" />
                  <span className="truncate">{formatRelativeDate(new Date(nextBillingDate))}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(amount, currency)}
            <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">
              {cycleLabel}
            </span>
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize truncate max-w-[80px]">
            {category || 'Uncategorized'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
