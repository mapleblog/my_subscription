import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  displayName: z.string().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName } = schema.parse(body);
    const c = await cookies();
    const auth = c.get('auth');
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    let userId = await redis.get<string>(`session:${auth.value}`);
    if (!userId) {
      const session = await prisma.session.findUnique({ where: { token: auth.value } });
      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });
    
    // Clear cache to update UI across all routes
    revalidatePath('/', 'layout');

    logger.info('USER_DISPLAY_NAME_UPDATE', 'Updated display name', { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('USER_DISPLAY_NAME_UPDATE_ERROR', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
