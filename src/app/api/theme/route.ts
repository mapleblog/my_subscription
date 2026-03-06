import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode } = schema.parse(body);
    const res = NextResponse.json({ success: true });
    const c = await cookies();
    c.set('theme', mode, { path: '/', httpOnly: false });
    res.cookies.set('theme', mode, { path: '/', httpOnly: false });
    logger.info('THEME_SET', 'Theme updated', { mode });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    logger.error('THEME_SET_ERROR', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
