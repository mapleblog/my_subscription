'use client';

import { motion, Variants } from 'framer-motion';
import React from 'react';
import { formatCurrencyParts } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { differenceInCalendarDays, format, isValid, startOfDay } from 'date-fns';

interface SubscriptionCardProps {
  id: string;
  name: string;
  amount: number;
  currency: string;
  nextBillingDate?: Date | string;
  cycle: string;
  isUpcoming?: boolean;
  isAutoRenew?: boolean;
  category?: string;
  categoryColor?: string;
  logo?: string; // Optional logo URL or placeholder
  variants?: Variants;
  onClick?: () => void;
}

type BillingDateInfo =
  | { ok: true; date: Date; ymd: string }
  | { ok: false; error: string };

function parseYYYYMMDDToLocalDate(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return startOfDay(date);
}

function getBillingDateInfo(input: Date | string): BillingDateInfo {
  if (input instanceof Date) {
    if (!isValid(input)) return { ok: false, error: 'Invalid next bill date' };
    const localDay = startOfDay(input);
    return { ok: true, date: localDay, ymd: format(localDay, 'yyyy-MM-dd') };
  }

  const trimmed = input.trim();
  const localDateOnly = parseYYYYMMDDToLocalDate(trimmed);
  if (localDateOnly) {
    return { ok: true, date: localDateOnly, ymd: format(localDateOnly, 'yyyy-MM-dd') };
  }

  const parsed = new Date(trimmed);
  if (!isValid(parsed)) return { ok: false, error: 'Invalid next bill date' };
  const localDay = startOfDay(parsed);
  return { ok: true, date: localDay, ymd: format(localDay, 'yyyy-MM-dd') };
}

function SubscriptionCardBase({
  id,
  name,
  amount,
  currency,
  nextBillingDate,
  cycle,
  isUpcoming,
  isAutoRenew,
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

  const billingDateInfo = React.useMemo(() => {
    if (!nextBillingDate) return null;
    return getBillingDateInfo(nextBillingDate);
  }, [nextBillingDate]);

  const reminderBadge = React.useMemo(() => {
    if (!billingDateInfo) return null;

    if (!billingDateInfo.ok) {
      return {
        className: 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md',
        icon: <AlertCircle size={12} className="opacity-90" />,
        text: billingDateInfo.error,
      };
    }

    const today = startOfDay(new Date());
    const diffDays = differenceInCalendarDays(billingDateInfo.date, today);
    const absDiffDays = Math.abs(diffDays);

    if (diffDays <= 3) {
      const text =
        diffDays === 0
          ? 'Bill due today'
          : diffDays > 0
            ? `Bill due in ${absDiffDays} ${absDiffDays === 1 ? 'day' : 'days'}`
            : `Bill overdue by ${absDiffDays} ${absDiffDays === 1 ? 'day' : 'days'}`;

      return {
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg',
        icon: <AlertCircle size={12} className="opacity-95" />,
        text,
      };
    }

    if (diffDays > 3 && diffDays <= 7) {
      return {
        className: 'bg-gradient-to-r from-amber-400 to-amber-300 text-black shadow-md',
        icon: <AlertTriangle size={12} className="opacity-90" />,
        text: `Bill due in ${absDiffDays} days`,
      };
    }

    return null;
  }, [billingDateInfo]);

  const expiredBanner = React.useMemo(() => {
    if (!billingDateInfo || !billingDateInfo.ok) return null;
    const today = startOfDay(new Date());
    const isExpired = differenceInCalendarDays(billingDateInfo.date, today) < 0 && !isAutoRenew;
    if (!isExpired) return null;
    return {
      text: 'Expired — Renew to resume',
    };
  }, [billingDateInfo, isAutoRenew]);

  const isExpired = React.useMemo(() => {
    if (!billingDateInfo || !billingDateInfo.ok) return false;
    const today = startOfDay(new Date());
    return differenceInCalendarDays(billingDateInfo.date, today) < 0 && !isAutoRenew;
  }, [billingDateInfo, isAutoRenew]);

  return (
    <motion.div
      layout="position"
      layoutId={`card-${id}`}
      onClick={onClick}
      variants={variants}
      whileTap={{ scale: 0.98 }}
      whileHover={isExpired ? undefined : { y: -4, transition: { duration: 0.2 } }}
      initial={false}
      animate={variants ? undefined : { opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 40,
        mass: 0.8,
      }}
      className={`relative w-full group ${isExpired ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {/* Wallet Pass Card */}
      <div 
        className={`relative overflow-hidden rounded-[24px] p-5 h-[140px] flex flex-col justify-between transition-all duration-300 ${isExpired ? 'filter grayscale saturate-50 contrast-75 opacity-85' : ''}`}
        style={cardStyle}
      >
        {/* Glass/Noise Texture Overlay (Optional, using subtle gradient instead for performance) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        {isExpired && (
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        )}
        
        {reminderBadge && (
          <div
            className={`absolute -top-1 -left-4 w-[64px] h-7 rotate-[-22deg] ${reminderBadge.className} z-20 flex items-center justify-center transition-all duration-300`}
            style={{ borderRadius: 9999 }}
            title={reminderBadge.text}
            aria-label={reminderBadge.text}
            role="note"
          >
          </div>
        )}
        {expiredBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute top-3 right-3 z-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-xl border border-white/20 shadow-md">
              <AlertCircle size={14} className="opacity-90" />
              <span className="text-xs font-semibold tracking-wide">
                {expiredBanner.text}
              </span>
            </div>
          </motion.div>
        )}

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
                <span>{billingDateInfo?.ok ? billingDateInfo.ymd : 'Invalid date'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const SubscriptionCard = React.memo(SubscriptionCardBase);
