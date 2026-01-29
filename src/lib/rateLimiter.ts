import { RateLimiterMemory } from 'rate-limiter-flexible';

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
