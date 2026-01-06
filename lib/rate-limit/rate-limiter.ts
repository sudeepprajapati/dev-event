/**
 * Production-Grade Rate Limiter
 * 
 * Implements distributed rate limiting using Upstash Redis with the following features:
 * - Token bucket algorithm for smooth rate limiting
 * - Sliding window for accurate tracking
 * - IP and user-based rate limiting
 * - Graceful fallback for development
 * - Proper HTTP 429 responses with Retry-After header
 */

import { Ratelimit } from '@upstash/ratelimit';
import {
    getRedisClient,
    RateLimitConfig as RedisRateLimitConfig,
    getClientIP,
    getUserId,
    createRateLimitKey,
} from './redis';

// Re-export types
export type RateLimitConfig = RedisRateLimitConfig;

export interface RateLimitResult {
    /** Whether the request is allowed */
    success: boolean;
    /** Remaining requests in the current window */
    remaining: number;
    /** Reset timestamp in milliseconds */
    reset: Date;
    /** Retry-After header value in seconds */
    retryAfter?: number;
    /** Rate limit identifier */
    identifier: string;
}

/**
 * In-memory fallback for development environments
 * WARNING: Not production-safe - resets on server restart/redeploy
 */
class InMemoryRateLimiter {
    private static instance: InMemoryRateLimiter;
    private counters = new Map<string, { count: number; reset: number }>();

    private constructor() {}

    static getInstance(): InMemoryRateLimiter {
        if (!InMemoryRateLimiter.instance) {
            InMemoryRateLimiter.instance = new InMemoryRateLimiter();
        }
        return InMemoryRateLimiter.instance;
    }

    async check(
        key: string,
        limit: number,
        window: number
    ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
        const now = Date.now();
        const windowMs = window * 1000;
        const reset = Math.floor(now / windowMs) * windowMs + windowMs;

        const existing = this.counters.get(key);

        if (existing && existing.reset === reset) {
            existing.count++;
            this.counters.set(key, existing);
            return {
                allowed: existing.count <= limit,
                remaining: Math.max(0, limit - existing.count),
                reset,
            };
        }

        this.counters.set(key, { count: 1, reset });
        return {
            allowed: 1 <= limit,
            remaining: limit - 1,
            reset,
        };
    }

    // Cleanup old entries (call periodically)
    cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.counters.entries()) {
            if (value.reset < now) {
                this.counters.delete(key);
            }
        }
    }
}

/**
 * Rate limiter implementation using Upstash Redis or in-memory fallback
 */
export class RateLimiter {
    private config: Required<RateLimitConfig>;
    private redis: ReturnType<typeof getRedisClient>;
    private inMemoryLimiter: InMemoryRateLimiter;
    private ratelimit: Ratelimit | null = null;

    constructor(config: RateLimitConfig) {
        this.config = {
            ipBased: true,
            userBased: false,
            ...config,
        } as Required<RateLimitConfig>;

        this.redis = config.redis || getRedisClient();
        this.inMemoryLimiter = InMemoryRateLimiter.getInstance();

        // Initialize Upstash Ratelimit if Redis is available
        if (this.redis) {
            this.ratelimit = new Ratelimit({
                redis: this.redis,
                limiter: Ratelimit.slidingWindow(this.config.limit, `${this.config.window}s`),
                analytics: true,
                prefix: `ratelimit:${this.config.identifier}`,
            });
        }
    }

    /**
     * Check if a request should be rate limited
     * 
     * @param request - Request object
     * @returns Rate limit result with success status and metadata
     */
    async check(request: Request): Promise<RateLimitResult> {
        const ip = getClientIP(request);
        const userId = getUserId(request);
        const key = createRateLimitKey(this.config, ip, userId);

        // Use Redis rate limiter if available
        if (this.ratelimit) {
            try {
                const result = await this.ratelimit.limit(key);
                const now = Date.now();
                const windowMs = this.config.window * 1000;

                return {
                    success: result.success,
                    remaining: result.remaining,
                    reset: new Date(result.reset),
                    retryAfter: result.success
                        ? undefined
                        : Math.ceil((result.reset - now) / 1000),
                    identifier: key,
                };
            } catch (error) {
                console.error('[RateLimit] Redis error, falling back to in-memory:', error);
            }
        }

        // Fallback to in-memory rate limiter
        const result = await this.inMemoryLimiter.check(
            key,
            this.config.limit,
            this.config.window
        );

        return {
            success: result.allowed,
            remaining: result.remaining,
            reset: new Date(result.reset),
            retryAfter: result.allowed
                ? undefined
                : Math.ceil((result.reset - Date.now()) / 1000),
            identifier: key,
        };
    }

    /**
     * Check multiple rate limits with different configurations
     * All limits must pass for the request to be allowed
     * 
     * @param request - Request object
     * @param configs - Array of rate limit configurations
     * @returns Strictest rate limit result
     */
    static async checkMultiple(
        request: Request,
        configs: RateLimitConfig[]
    ): Promise<RateLimitResult> {
        let strictestResult: RateLimitResult | null = null;

        for (const config of configs) {
            const limiter = new RateLimiter(config);
            const result = await limiter.check(request);

            if (!result.success) {
                return result;
            }

            if (
                !strictestResult ||
                result.remaining < strictestResult.remaining
            ) {
                strictestResult = result;
            }
        }

        return strictestResult || {
            success: true,
            remaining: 0,
            reset: new Date(),
            identifier: 'none',
        };
    }
}

// Cleanup old in-memory entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        InMemoryRateLimiter.getInstance().cleanup();
    }, 5 * 60 * 1000);
}
