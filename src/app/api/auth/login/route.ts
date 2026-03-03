import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/services/auth.service';
import { logger } from '@/lib/logger';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);
    const { token, created } = await AuthService.autoRegisterOrLogin(email, password);

    const res = NextResponse.json({ success: true, created });
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    logger.info('AUTH_API_LOGIN', 'Login API success', { email, created });
    return res;
  } catch (error) {
    logger.error('AUTH_API_LOGIN_ERROR', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
