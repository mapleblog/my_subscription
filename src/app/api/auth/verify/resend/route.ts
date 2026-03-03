import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { MailService } from '@/services/mail.service';
import { randomBytes } from 'crypto';

async function createVerificationRecord(userId: string, token: string, expires: Date) {
  // Prefer Prisma model API; fallback to raw SQL if model mapping is unavailable in the client
  // This ensures availability immediately after schema changes without a server restart.
  // Table name follows Prisma default: "EmailVerification"
  // Columns with defaults: id (cuid), createdAt, updatedAt
  // Safe parameterization via $executeRaw template.
  if (prisma.emailVerification?.create) {
    return prisma.emailVerification.create({ data: { userId, token, expiresAt: expires } });
  }
  await prisma.$executeRaw`INSERT INTO "EmailVerification" ("userId","token","expiresAt") VALUES (${userId}, ${token}, ${expires})`;
}
const bodySchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const { email } = bodySchema.parse(await request.json());
    const c = (await cookies()).get('auth')?.value;
    let userId: string | null = null;
    if (c) {
      userId = (await redis.get<string>(`session:${c}`)) || null;
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.isVerified) {
      return NextResponse.json({ success: false, error: 'Already verified' }, { status: 400 });
    }

    // Rate limit: 3 per hour per user
    const key = `verify_resend:${user.id}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60 * 60);
    }
    if (count > 3) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const vt = randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createVerificationRecord(user.id, vt, expires);
    const origin = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${origin}/verify?token=${vt}`;
    const sent = await MailService.sendEmail({
      to: user.email,
      subject: 'Verify your Subly email',
      html: MailService.buildVerificationHtml(verifyUrl),
    });
    await redis.incr('metrics:email_sent');
    logger.info('EMAIL_VERIFY_RESEND', 'Verification email resent', { userId: user.id });
    // If no provider configured, return verifyUrl so user can click directly in dev
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, verifyUrl });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('EMAIL_VERIFY_RESEND_ERROR', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
