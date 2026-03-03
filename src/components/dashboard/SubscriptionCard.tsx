'use client';

import { motion, Variants } from 'framer-motion';
import { formatCurrencyParts, formatRelativeDate } from '@/lib/utils';
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
  categoryColor?: string;
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
  categoryColor = '#6366F1', // Default Indigo
  variants,
  onClick,
}: SubscriptionCardProps) {
  
  // Format cycle (Monthly -> /mo, Yearly -> /yr)
  const cycleLabel = cycle === 'Monthly' ? '/mo' : cycle === 'Yearly' ? '/yr' : `/${cycle}`;

  // Wallet Pass Style Logic
  // Use category color as the main card background
  // Add a subtle gradient overlay to give it depth (top-left light to bottom-right dark)
  const cardStyle = {
    background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}CC 100%), linear-gradient(to bottom right, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%)`,
    boxShadow: `0 8px 24px -6px ${categoryColor}66, 0 4px 12px -4px rgba(0,0,0,0.1)`, // Colored shadow matching the card
  };

  return (
    <motion.div
      layoutId={`card-${name}`} 
      onClick={onClick}
      variants={variants}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={variants ? undefined : { opacity: 0, y: 20 }}
      animate={variants ? undefined : { opacity: 1, y: 0 }}
      transition={variants ? undefined : { type: 'spring', stiffness: 300, damping: 20 }}
      className="relative w-full group cursor-pointer"
    >
      {/* Wallet Pass Card */}
      <div 
        className="relative overflow-hidden rounded-[24px] p-5 h-[140px] flex flex-col justify-between transition-all duration-300"
        style={cardStyle}
      >
        {/* Glass/Noise Texture Overlay (Optional, using subtle gradient instead for performance) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {/* Top Row: Logo & Amount */}
        <div className="relative flex justify-between items-start z-10">
          {/* Logo Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-white drop-shadow-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-2xl font-bold text-white tracking-tight drop-shadow-md leading-none">
              {(() => {
                const parts = formatCurrencyParts(amount, currency);
                return (
                  <span className="inline-flex items-baseline gap-1">
                    <span>{parts.symbol}</span>
                    <span>{parts.integer}</span>
                    <span className="text-base font-medium opacity-80">.{parts.fraction}</span>
                  </span>
                );
              })()}
            </div>
            <div className="text-xs font-medium text-white/70 mt-0.5">
              {cycleLabel}
            </div>
          </div>
        </div>

        {/* Bottom Row: Info & Category */}
        <div className="relative flex justify-between items-end z-10">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight truncate drop-shadow-sm pr-2">
              {name}
            </h3>
            {/* Category Badge - Minimal */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/10 text-white/90 backdrop-blur-md border border-white/10 truncate">
                {category || 'Uncategorized'}
              </span>
            </div>
          </div>

          {/* Date / Status */}
          <div className="text-right shrink-0">
            {isUpcoming && (
              <div className="mb-1 flex justify-end">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-black shadow-sm animate-pulse">
                  <Sparkles size={10} className="mr-1 text-yellow-500 fill-yellow-500" />
                  Soon
                </span>
              </div>
            )}
            {nextBillingDate && (
              <div className="flex items-center justify-end text-xs font-medium text-white/80 drop-shadow-sm">
                <Calendar size={12} className="mr-1.5 opacity-70" />
                <span>{formatRelativeDate(new Date(nextBillingDate))}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
