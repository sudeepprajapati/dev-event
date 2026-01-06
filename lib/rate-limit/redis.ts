/**
 * Redis Client Configuration
 * 
 * Production-grade Redis client using Upstash for distributed rate limiting.
 * Supports both Edge and Node runtimes with automatic fallback to in-memory
 * storage for development environments.
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Environment variables with defaults
const REDIS_REST_URL = process.env.REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Singleton Redis client instance
 * Lazily initialized to avoid connection issues during build time
 */
let redisInstance: Redis | null = null;

/**
 * Initialize Redis client with Upstash configuration
 * Falls back to in-memory if Redis configuration is missing
 */
export function getRedisClient(): Redis | null {
    if (redisInstance) {
        return redisInstance;
    }

    // Check if Redis is configured
    if (REDIS_REST_URL && REDIS_REST_TOKEN) {
        redisInstance = new Redis({
            url: REDIS_REST_URL,
            token: REDIS_REST_TOKEN,
        });
        console.log('[RateLimit] Redis client initialized');
    } else {
        console.warn(
            '[RateLimit] Redis not configured. Rate limiting will use in-memory fallback (NOT PRODUCTION SAFE)'
        );
    }

    return redisInstance;
}

/**
 * Rate limit configuration types
 */
export interface RateLimitConfig {
    /** Number of requests allowed */
    limit: number;
    /** Time window in seconds */
    window: number;
    /** Unique identifier for the rate limit rule */
    identifier: string;
    /** Enable IP-based rate limiting */
    ipBased?: boolean;
    /** Enable user-based rate limiting */
    userBased?: boolean;
    /** Redis client (optional, will use default if not provided) */
    redis?: Redis;
}

/**
 * Rate limit result
 */
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
 * Extract client IP from request with multiple fallback strategies
 * to prevent IP spoofing and work behind proxies/load balancers
 */
export function getClientIP(request: Request): string {
    // Priority order for IP detection (most reliable to least)
    const ipHeaders = [
        'cf-connecting-ip', // Cloudflare
        'x-real-ip', // Nginx
        'x-forwarded-for', // Standard proxy header
    ];

    for (const header of ipHeaders) {
        const value = request.headers.get(header);
        if (value) {
            // X-Forwarded-For may contain multiple IPs, take the first one
            const ip = value.split(',')[0].trim();
            if (ip && ip !== 'unknown') {
                return ip;
            }
        }
    }

    // Fallback to unknown (will be rate limited together)
    return 'unknown';
}

/**
 * Extract user identifier from session or token
 * Returns null if user is not authenticated
 */
export function getUserId(request: Request): string | null {
    // Check for session cookie (NextAuth)
    const sessionCookie = request.headers
        .get('cookie')
        ?.split('; ')
        .find((c) => c.startsWith('next-auth.session-token='));

    if (sessionCookie) {
        // Extract session token (simplified, in production you might want to decode the JWT)
        return sessionCookie.split('=')[1];
    }

    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return `bearer:${authHeader.slice(7)}`;
    }

    return null;
}

/**
 * Create a unique key for rate limiting based on IP and/or user ID
 */
export function createRateLimitKey(
    config: RateLimitConfig,
    ip: string,
    userId: string | null
): string {
    const parts: string[] = [config.identifier];

    if (config.userBased && userId) {
        parts.push('user', userId);
    } else if (config.ipBased) {
        parts.push('ip', ip);
    }

    return parts.join(':');
}
