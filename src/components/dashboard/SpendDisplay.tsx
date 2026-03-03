'use client';

import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';

interface SpendDisplayProps {
  totalAmount: number; // in cents
  currency?: string;
}

export function SpendDisplay({ totalAmount, currency = 'MYR' }: SpendDisplayProps) {
  const animatedAmount = useCountUp(totalAmount);
  
  // Format cents to currency (e.g. 3490 -> 34.90)
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-3xl">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-white dark:bg-black">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-70 animate-pulse" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-24 -right-24 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-20 w-64 h-64 bg-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
        >
          Total Monthly Spend
        </motion.span>
        
        <motion.h1 
          className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {formatCurrency(animatedAmount)}
        </motion.h1>
      </div>
    </div>
  );
}
