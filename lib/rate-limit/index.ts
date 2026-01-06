/**
 * Export all rate limiting utilities for easy imports
 */

export {
    getRedisClient,
    getClientIP,
    getUserId,
    createRateLimitKey,
} from './redis';

export { RateLimiter } from './rate-limiter';
export type { RateLimitResult } from './rate-limiter';
export type { RateLimitConfig } from './rate-limiter';

export {
    withRateLimit,
    withRateLimitAction,
    checkRateLimit,
    getRateLimitHeaders,
    createRateLimitResponse,
    RATE_LIMIT_PRESETS,
} from './middleware';
