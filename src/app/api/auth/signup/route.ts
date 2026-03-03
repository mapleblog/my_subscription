import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/services/auth.service';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);
    const { token } = await AuthService.createUser(email, password);
    const res = NextResponse.json({ success: true });
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
