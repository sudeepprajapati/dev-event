/**
 * Rate Limiting Examples
 * 
 * This file demonstrates how to apply rate limiting to various endpoints
 * in your Next.js application.
 */

import {
    checkRateLimit,
    createRateLimitResponse,
    RATE_LIMIT_PRESETS,
} from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

// ============================================================
// Example 1: Admin Protected Endpoint
// ============================================================

export async function exampleAdminEndpoint(req: NextRequest) {
    try {
        // Step 1: Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Step 2: Check admin permission (if needed)
        if (session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json(
                { message: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // Step 3: Check rate limit
        const rateLimitResult = await checkRateLimit(
            req,
            RATE_LIMIT_PRESETS.ADMIN
        );

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        // Step 4: Your admin logic here
        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// Example 2: Multiple Rate Limits (Strict)
// ============================================================

export async function exampleMultipleLimits(req: NextRequest) {
    try {
        // Check multiple rate limits (ALL must pass)
        const [authCheck, customCheck] = await Promise.all([
            checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH),
            checkRateLimit(req, {
                limit: 10,
                window: 60,
                identifier: 'custom-check',
                ipBased: true,
            }),
        ]);

        // Return first failed check
        if (!authCheck.success) {
            return createRateLimitResponse(authCheck);
        }

        if (!customCheck.success) {
            return createRateLimitResponse(customCheck);
        }

        // Your logic here
        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// Example 3: Custom Rate Limit Configuration
// ============================================================

export async function exampleCustomLimit(req: NextRequest) {
    try {
        // Define custom rate limit
        const customConfig = {
            limit: 20,           // 20 requests
            window: 300,         // per 5 minutes
            identifier: 'my-custom-endpoint',
            ipBased: true,       // By IP
            userBased: false,     // Not by user
        };

        const rateLimitResult = await checkRateLimit(req, customConfig);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        // Your logic here
        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// Example 4: Rate Limiting by User ID Only
// ============================================================

export async function exampleUserBasedLimit(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only rate limit by user ID (not IP)
        // Useful for actions where each user should have their own limit
        const rateLimitResult = await checkRateLimit(req, {
            limit: 10,
            window: 60,
            identifier: 'user-action',
            userBased: true,   // Rate limit by user ID
            ipBased: false,    // Ignore IP
        });

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        // Your logic here
        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// Example 5: Per-Endpoint Rate Limits
// ============================================================

export async function GET(req: NextRequest) {
    const rateLimitResult = await checkRateLimit(
        req,
        { ...RATE_LIMIT_PRESETS.PUBLIC_API, identifier: 'events:get' }
    );

    if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
    }

    return NextResponse.json({ message: 'GET success' });
}

export async function POST(req: NextRequest) {
    const rateLimitResult = await checkRateLimit(
        req,
        { ...RATE_LIMIT_PRESETS.CREATE_EVENT, identifier: 'events:post' }
    );

    if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
    }

    return NextResponse.json({ message: 'POST success' });
}

export async function DELETE(req: NextRequest) {
    const rateLimitResult = await checkRateLimit(
        req,
        { ...RATE_LIMIT_PRESETS.ADMIN, identifier: 'events:delete' }
    );

    if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
    }

    return NextResponse.json({ message: 'DELETE success' });
}

// ============================================================
// Example 6: Rate Limiting with Custom Headers
// ============================================================

export async function exampleWithCustomHeaders(req: NextRequest) {
    try {
        const rateLimitResult = await checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH);

        if (!rateLimitResult.success) {
            const response = createRateLimitResponse(rateLimitResult);

            // Add custom headers
            response.headers.set('X-Custom-Header', 'value');
            response.headers.set('X-RateLimit-Endpoint', 'my-endpoint');

            return response;
        }

        const data = { message: 'Success' };
        const response = NextResponse.json(data);

        // Add custom headers on success
        response.headers.set('X-Custom-Header', 'value');

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// Migration Guide: Adding Rate Limiting to Existing Routes
// ============================================================

/*
  To add rate limiting to an existing API route, follow these steps:

  1. Import rate limiting utilities:
     ```typescript
     import { checkRateLimit, createRateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
     ```

  2. Add rate limit check at the start of your handler:
     ```typescript
     export async function POST(req: NextRequest) {
         try {
             const rateLimitResult = await checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH);
             if (!rateLimitResult.success) {
                 return createRateLimitResponse(rateLimitResult);
             }

             // Rest of your code...
         } catch (error) {
             // Error handling...
         }
     }
     ```

  3. Choose the right preset:
     - AUTH: For signup/signin endpoints (5 req/min by IP)
     - PUBLIC_API: For public endpoints (100 req/min by IP)
     - PAYMENT: For payment/booking (10 req/min by user)
     - CREATE_EVENT: For event creation (5 per 5min by user)
     - ADMIN: For admin operations (50 req/min by user)

  4. Or create custom limits as needed.

  5. Test your implementation:
     - Send requests rapidly to trigger rate limit
     - Check response headers (X-RateLimit-* and Retry-After)
     - Verify 429 status is returned
     - Check that retry-after time is reasonable
*/
