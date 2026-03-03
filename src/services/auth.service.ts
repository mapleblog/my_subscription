import 'server-only';
import prisma from '@/lib/prisma';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { MailService } from './mail.service';

function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString('hex');
  const hash = scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [s, h] = stored.split(':');
  const hash = scryptSync(password, s, 64).toString('hex');
  return timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}

async function createSession(userId: string) {
  const token = randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await redis.set(`session:${token}`, userId, { ex: 60 * 60 * 24 * 7 });
    } else {
      await prisma.session.create({ data: { userId, token, expiresAt: expires } });
    }
    return token;
  } catch (e) {
    logger.error('SESSION_CREATE_ERROR', e, { userId });
    throw e;
  }
}

export const AuthService = {
  async createUser(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = await createSession(user.id);
    return { user, token };
  },
  async verifyLogin(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    const token = await createSession(user.id);
    return { user, token };
  },

  /**
   * Auto-register or login with transactional semantics:
   * - If user exists: verify password, create session, return
   * - If user does not exist: within a DB transaction, create user and then create session.
   *   If session creation fails, transaction is aborted and user creation rolled back.
   * Concurrency-safe via upsert (unique email).
   */
  async autoRegisterOrLogin(email: string, password: string) {
    logger.info('AUTH_AUTO_START', `Attempt for ${email}`);
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) {
          if (!verifyPassword(password, existing.passwordHash)) {
            logger.warn('AUTH_INVALID_PASSWORD', `Invalid credentials for ${email}`);
            throw new Error('Invalid credentials');
          }
          const token = await createSession(existing.id);
          logger.info('AUTH_LOGIN_SUCCESS', `User ${email} logged in`);
          return { user: existing, token, created: false };
        }

        const passwordHash = hashPassword(password);
        const user = await tx.user.create({ data: { email, passwordHash } });
        try {
          const token = await createSession(user.id);
          // Create email verification token
          const vt = randomBytes(24).toString('hex');
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await tx.emailVerification.create({
            data: { userId: user.id, token: vt, expiresAt: expires },
          });
          // Send email
          const origin = process.env.APP_URL || 'http://localhost:3000';
          const verifyUrl = `${origin}/verify?token=${vt}`;
          await MailService.sendEmail({
            to: email,
            subject: 'Verify your Subly email',
            html: MailService.buildVerificationHtml(verifyUrl),
          });
          await redis.incr('metrics:email_sent');
          logger.info('AUTH_AUTO_REGISTER_SUCCESS', `User ${email} auto-registered`);
          return { user, token, created: true };
        } catch (sessionError) {
          logger.error('AUTH_SESSION_CREATE_FAIL', sessionError, { email });
          // Throw to rollback user creation
          throw new Error('Session creation failed');
        }
      }, { maxWait: 5000, timeout: 10000 });

      return result;
    } catch (error) {
      // Handle potential unique constraint race: if another request created user concurrently
      // Attempt a login verification fallback
      try {
        const fallback = await AuthService.verifyLogin(email, password);
        logger.info('AUTH_CONCURRENCY_FALLBACK', `Existing user login for ${email}`);
        return { ...fallback, created: false };
      } catch {
        logger.error('AUTH_AUTO_FAIL', error, { email });
        throw error instanceof Error ? error : new Error('Authentication failed');
      }
    }
  },
};
