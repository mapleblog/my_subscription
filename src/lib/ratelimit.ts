import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';
import { logger } from './logger';

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

/**
 * Middleware to check rate limit
 * @param identifier Unique identifier for the user (e.g., IP address or User ID)
 * @returns {Promise<boolean>} true if allowed, false if limited
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  // Bypass if no real Redis config (dev mode fallback)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    logger.warn('RATE_LIMIT_SKIP', 'Upstash Redis not configured, skipping rate limit check');
    return true;
  }

  try {
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      logger.warn('RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${identifier}`);
    }
    return success;
  } catch (error) {
    logger.error('RATE_LIMIT_ERROR', error);
    // Fail open if Redis is down, or fail closed? Usually fail open for UX.
    return true; 
  }
}
