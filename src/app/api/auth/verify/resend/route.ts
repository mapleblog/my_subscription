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
  resetRateLimit: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const { email, resetRateLimit } = bodySchema.parse(await request.json());
    const c = (await cookies()).get('auth')?.value;
    const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    let userId: string | null = null;
    if (c) {
      if (hasUpstash) {
        userId = (await redis.get<string>(`session:${c}`)) || null;
      } else {
        const session = await prisma.session.findUnique({ where: { token: c } });
        if (session && session.expiresAt > new Date()) {
          userId = session.userId;
        }
      }
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
    if (hasUpstash) {
      const key = `verify_resend:${user.id}`;
      if (resetRateLimit && process.env.NODE_ENV !== 'production') {
        await redis.del(key);
        logger.info('EMAIL_VERIFY_RESEND_RATE_LIMIT_RESET', 'Rate limit reset in dev', { userId: user.id });
        return NextResponse.json({ success: true, resetRateLimit: true });
      }
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 60 * 60);
      }
      if (count > 3) {
        let retryAfterSeconds: number | null = null;
        try {
          const ttl = await redis.ttl(key);
          retryAfterSeconds = typeof ttl === 'number' && ttl > 0 ? ttl : null;
        } catch {}
        return NextResponse.json(
          { success: false, error: 'Rate limited', retryAfterSeconds },
          {
            status: 429,
            headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined,
          }
        );
      }
    } else {
      logger.warn('VERIFY_RESEND_RATE_LIMIT_BYPASS', 'Upstash not configured; rate limit bypassed', { userId: user.id });
    }

    const vt = randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createVerificationRecord(user.id, vt, expires);
    const origin = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${origin}/verify?token=${vt}`;
    const result = await MailService.sendEmail({
      to: user.email,
      subject: 'Verify your Subly email',
      html: MailService.buildVerificationHtml(verifyUrl),
    });

    const includeVerifyUrl = process.env.NODE_ENV !== 'production';
    if (!result.success) {
      logger.error('EMAIL_VERIFY_RESEND_SEND_FAIL', 'Email sending failed', { userId: user.id, provider: result.provider, status: result.status, error: result.error });
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Email sending failed',
          provider: result.provider,
          status: result.status,
          verifyUrl: includeVerifyUrl ? verifyUrl : undefined,
        },
        { status: 502 }
      );
    }

    if (hasUpstash) {
      await redis.incr('metrics:email_sent');
    }

    logger.info('EMAIL_VERIFY_RESEND', 'Verification email resent', {
      userId: user.id,
      provider: result.provider,
      id: result.provider === 'resend' ? result.id : undefined,
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      id: result.provider === 'resend' ? result.id : undefined,
      verifyUrl: includeVerifyUrl ? verifyUrl : undefined,
    });
  } catch (error) {
    logger.error('EMAIL_VERIFY_RESEND_ERROR', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
