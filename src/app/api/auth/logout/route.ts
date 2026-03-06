import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const c = (await cookies()).get('auth')?.value;
    const res = NextResponse.json({ success: true });

    if (!c) {
      res.cookies.delete('auth');
      logger.info('AUTH_API_LOGOUT', 'No auth cookie, nothing to do');
      return res;
    }

    const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    if (hasUpstash) {
      try {
        await redis.del(`session:${c}`);
      } catch (e) {
        logger.warn('AUTH_LOGOUT_REDIS_DEL_FAIL', 'Failed to delete Redis session', { token: c }, e);
      }
    } else {
      try {
        await prisma.session.delete({ where: { token: c } });
      } catch {
        // idempotent
      }
    }

    res.cookies.delete('auth');
    logger.info('AUTH_API_LOGOUT', 'Logout success');
    return res;
  } catch (error) {
    logger.error('AUTH_API_LOGOUT_ERROR', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
