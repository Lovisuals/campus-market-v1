import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const postSubmissionLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true
});

export const otpRequestLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true
});

export const dmLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  analytics: true
});

export async function checkRateLimit(
  key: string,
  limiter: Ratelimit
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(key);

  return {
    allowed: success,
    remaining,
    reset
  };
}
