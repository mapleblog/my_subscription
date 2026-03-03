import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Prevent Vercel from caching this route

export async function GET(request: Request) {
  // Security check for Cron Secret
  const authHeader = request.headers.get('authorization');
  // Vercel Cron uses "Bearer <CRON_SECRET>"
  // We can also allow a simple header check if preferred, but Authorization is standard.
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedSecret) {
    logger.warn('CRON_UNAUTHORIZED', 'Invalid or missing authorization header');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    logger.info('CRON_START', 'Starting payment check job');
    
    // Check for payments due in the next 3 days
    const result = await NotificationService.processUpcomingPayments(3);
    
    logger.info('CRON_COMPLETE', 'Payment check job completed', { result });
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('CRON_ERROR', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
