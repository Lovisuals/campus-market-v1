import { RateLimiterMemory } from 'rate-limiter-flexible';

// WARNING: This uses in-memory rate limiting which doesn't persist across restarts
// For production, use Upstash Redis rate limiter from @/lib/rate-limit.ts instead
// This is kept for backward compatibility but should be replaced

export const listingRateLimiter = new RateLimiterMemory({
  keyPrefix: 'listing',
  points: 10, // Number of requests
  duration: 60 * 60, // Per 1 hour
});

export const listingRateLimiterByIP = new RateLimiterMemory({
  keyPrefix: 'listing_ip',
  points: 10, // Number of requests
  duration: 60 * 60, // Per 1 hour
});

// TODO: Migrate to Upstash Redis for distributed rate limiting
// import { postSubmissionLimit } from '@/lib/rate-limit';
