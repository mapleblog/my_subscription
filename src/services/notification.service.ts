import 'server-only';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export const NotificationService = {
  /**
   * Scan for subscriptions due within the next N days (default 3)
   * Updates isUpcoming flag based on nextBillingDate
   */
  processUpcomingPayments: async (days = 3) => {
    const today = new Date();
    // Reset time part to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);
    targetDate.setHours(23, 59, 59, 999); // End of target day

    try {
      // 1. Mark subscriptions as upcoming
      const upcoming = await prisma.subscription.findMany({
        where: {
          isActive: true,
          nextBillingDate: {
            gte: today,
            lte: targetDate,
          },
          isUpcoming: false,
        },
        select: { id: true },
      });

      let markedCount = 0;
      if (upcoming.length > 0) {
        const updateResult = await prisma.subscription.updateMany({
          where: {
            id: { in: upcoming.map(s => s.id) },
          },
          data: {
            isUpcoming: true,
          },
        });
        markedCount = updateResult.count;
        logger.info('NOTIFICATION_UPDATE', `Marked ${markedCount} subscriptions as upcoming`);
      }

      // 2. Reset flag for subscriptions that are no longer upcoming
      // (either date moved to future, or passed and processed/overdue)
      // Note: We might want to keep "overdue" as "upcoming" or separate state.
      // For now, if it's strictly outside the window [today, today+3], unmark it.
      // However, if it's in the past (overdue), we probably shouldn't unmark it unless handled.
      // But the logic "nextBillingDate within next 72 hours" implies future only.
      // If nextBillingDate < today, it's overdue.
      
      const resetResult = await prisma.subscription.updateMany({
        where: {
          isUpcoming: true,
          OR: [
            { isActive: false }, // Reset if inactive
            { nextBillingDate: { lt: today } }, // Past due (should be handled by another process or kept as alert)
            { nextBillingDate: { gt: targetDate } }, // Moved to future
          ],
        },
        data: {
          isUpcoming: false,
        },
      });

      if (resetResult.count > 0) {
        logger.info('NOTIFICATION_RESET', `Reset ${resetResult.count} subscriptions from upcoming status`);
      }

      return {
        marked: markedCount,
        reset: resetResult.count,
      };
    } catch (error) {
      logger.error('NOTIFICATION_SERVICE_ERROR', error);
      throw error;
    }
  },
};
