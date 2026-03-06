'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';
import { formatCurrencyParts } from '@/lib/utils';

interface SpendDisplayProps {
  totalAmount: number; // in cents
  currency?: string;
}

export function SpendDisplay({ totalAmount, currency = 'MYR' }: SpendDisplayProps) {
  const animatedAmount = useCountUp(totalAmount);
  const reduceMotion = useReducedMotion();
  
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-3xl">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-white dark:bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-70" />
        <motion.div
          className="pointer-events-none absolute -top-28 -right-28 w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl opacity-70 dark:opacity-50"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(96,165,250,0.62) 0%, rgba(168,85,247,0.4) 35%, rgba(0,0,0,0) 70%)',
          }}
          initial={false}
          animate={
            reduceMotion
              ? { opacity: 0.7 }
              : { x: [0, -6, 0], y: [0, 6, 0], opacity: [0.62, 0.78, 0.62] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 14, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        <motion.div
          className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-70 dark:opacity-50"
          style={{
            background:
              'radial-gradient(circle at 65% 65%, rgba(244,114,182,0.6) 0%, rgba(34,211,238,0.3) 35%, rgba(0,0,0,0) 70%)',
          }}
          initial={false}
          animate={
            reduceMotion
              ? { opacity: 0.7 }
              : { x: [0, 7, 0], y: [0, -7, 0], opacity: [0.58, 0.74, 0.58] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 16, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>

      {/* Glass Panel Overlay */}
      <div className="absolute inset-3 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg shadow-black/10" />
      <div className="absolute inset-3 rounded-3xl pointer-events-none bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full">
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
          {(() => {
            const parts = formatCurrencyParts(animatedAmount, currency);
            return (
              <span className="inline-flex items-baseline gap-1">
                <span>{parts.symbol}</span>
                <span>{parts.integer}</span>
                <span className="text-3xl font-semibold opacity-80">.{parts.fraction}</span>
              </span>
            );
          })()}
        </motion.h1>
      </div>
    </div>
  );
}
