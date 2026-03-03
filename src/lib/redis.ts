import { Redis } from '@upstash/redis';

// Initialize Redis client
// If env vars are missing, this will throw an error when used, 
// so we should handle it gracefully or ensure they are present.
// For dev/mock, we use fallback values to prevent crash on import.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});
