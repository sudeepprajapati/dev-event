/**
 * Rate Limiting Middleware for API Routes and Server Actions
 * 
 * Provides easy-to-use decorators and wrapper functions for applying
 * rate limiting to Next.js API routes and server actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, RateLimitConfig, RateLimitResult } from './rate-limiter';

/**
 * Rate limit preset configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
    /** Strict limit for authentication endpoints */
    AUTH: {
        limit: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
        window: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '60'),
        identifier: 'auth',
    } as RateLimitConfig,

    /** Moderate limit for public API endpoints */
    PUBLIC_API: {
        limit: parseInt(process.env.RATE_LIMIT_PUBLIC_API || '100'),
        window: parseInt(process.env.RATE_LIMIT_PUBLIC_API_WINDOW || '60'),
        identifier: 'public-api',
    } as RateLimitConfig,

    /** Strict limit for payment/booking endpoints */
    PAYMENT: {
        limit: parseInt(process.env.RATE_LIMIT_PAYMENT || '10'),
        window: parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW || '60'),
        identifier: 'payment',
        userBased: true,
    } as RateLimitConfig,

    /** Limit for event creation */
    CREATE_EVENT: {
        limit: parseInt(process.env.RATE_LIMIT_CREATE_EVENT || '5'),
        window: parseInt(process.env.RATE_LIMIT_CREATE_EVENT_WINDOW || '300'),
        identifier: 'create-event',
        userBased: true,
    } as RateLimitConfig,

    /** Limit for admin operations */
    ADMIN: {
        limit: parseInt(process.env.RATE_LIMIT_ADMIN || '50'),
        window: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW || '60'),
        identifier: 'admin',
        userBased: true,
    } as RateLimitConfig,
};

/**
 * Create a rate-limited API route handler
 * 
 * Usage:
 * ```typescript
 * export const GET = withRateLimit({
 *   ...RATE_LIMIT_PRESETS.PUBLIC_API,
 *   identifier: 'get-events'
 * }, async (req: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withRateLimit<T extends NextResponse>(
    config: RateLimitConfig,
    handler: (req: NextRequest) => Promise<T>
): (req: NextRequest) => Promise<T> {
    const limiter = new RateLimiter(config);

    return async (req: NextRequest) => {
        const result = await limiter.check(req);

        // Set rate limit headers on all responses
        const headers = new Headers();
        headers.set('X-RateLimit-Limit', config.limit.toString());
        headers.set('X-RateLimit-Remaining', result.remaining.toString());
        headers.set('X-RateLimit-Reset', result.reset.toISOString());

        if (!result.success) {
            headers.set('Retry-After', (result.retryAfter || 60).toString());

            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
                    retryAfter: result.retryAfter,
                },
                {
                    status: 429,
                    headers,
                }
            ) as T;
        }

        // Pass request to handler with rate limit headers
        const response = await handler(req);

        // Clone and add headers to the response
        const newResponse = new Response(response.body, response);
        headers.forEach((value, key) => {
            newResponse.headers.set(key, value);
        });

        return newResponse as T;
    };
}

/**
 * Create a rate-limited server action
 * 
 * Usage:
 * ```typescript
 * export const signupUser = withRateLimitAction({
 *   ...RATE_LIMIT_PRESETS.AUTH,
 *   identifier: 'signup'
 * }, async (data: SignupFormData) => {
 *   // Your action logic here
 * });
 * ```
 */
export function withRateLimitAction<T extends { status?: number }>(
    config: RateLimitConfig,
    handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
    const limiter = new RateLimiter(config);

    return async (...args: any[]): Promise<T> => {
        // Get the current request from the async context
        // Note: This requires Next.js 15+ with async local storage
        // For now, we'll use a simplified approach
        let request: Request | null = null;

        // Try to get request from args or context
        if (args[0] instanceof Request) {
            request = args[0];
        }

        // If no request found, we can't rate limit properly
        // This is a limitation of server actions without full request access
        if (!request) {
            console.warn('[RateLimit] No request context, skipping rate limit check');
            return handler(...args);
        }

        const result = await limiter.check(request);

        if (!result.success) {
            return {
                success: false,
                error: 'Too many requests',
                message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
                status: 429,
            } as unknown as T;
        }

        return handler(...args);
    };
}

/**
 * Rate limit checker that can be used inside existing API routes
 * 
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH);
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
 *     );
 *   }
 *   // Your API logic here
 * }
 * ```
 */
export async function checkRateLimit(
    request: Request,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const limiter = new RateLimiter(config);
    return limiter.check(request);
}

/**
 * Get rate limit headers from a rate limit result
 */
export function getRateLimitHeaders(result: RateLimitResult): Headers {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.identifier.split(':')[1] || '0');
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.reset.toISOString());
    if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
    }
    return headers;
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
    return NextResponse.json(
        {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
        },
        {
            status: 429,
            headers: getRateLimitHeaders(result),
        }
    );
}
