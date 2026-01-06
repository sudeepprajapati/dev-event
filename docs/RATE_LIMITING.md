# Rate Limiting Implementation Guide

## Overview

This application implements production-grade rate limiting to protect against:
- Brute-force attacks on authentication endpoints
- API abuse and scraping
- Payment endpoint abuse
- Spam creation of events
- Unexpected infrastructure costs

## Architecture

### Components

1. **Redis Client** (`lib/rate-limit/redis.ts`)
   - Configures Upstash Redis connection
   - Handles IP and user identification
   - Provides utilities for key generation

2. **Rate Limiter** (`lib/rate-limit/rate-limiter.ts`)
   - Core rate limiting logic
   - Uses Upstash Ratelimit with sliding window algorithm
   - Falls back to in-memory for development

3. **Middleware Helpers** (`lib/rate-limit/middleware.ts`)
   - `withRateLimit()` - Wrapper for API routes
   - `checkRateLimit()` - Manual check for complex routes
   - Preset configurations for common use cases

### Algorithm

Uses **Sliding Window** algorithm via Upstash Ratelimit:
- Provides smooth rate limiting (no sudden drops at window boundaries)
- Accurate request counting
- Distributed across all serverless instances
- Atomic operations prevent race conditions

## Usage

### 1. Basic API Route Protection

```typescript
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withRateLimit(
    {
        ...RATE_LIMIT_PRESETS.PUBLIC_API,
        identifier: 'get-events',
    },
    async (req: NextRequest) => {
        // Your API logic here
        return NextResponse.json({ events: [] });
    }
);

export const POST = withRateLimit(
    {
        ...RATE_LIMIT_PRESETS.CREATE_EVENT,
        identifier: 'create-event',
    },
    async (req: NextRequest) => {
        // Create event logic
        return NextResponse.json({ success: true });
    }
);
```

### 2. Custom Rate Limits

```typescript
export const POST = withRateLimit(
    {
        limit: 20,           // 20 requests
        window: 300,         // per 5 minutes (300 seconds)
        identifier: 'custom-endpoint',
        ipBased: true,       // Rate limit by IP
        userBased: false,    // Not by user ID
    },
    async (req: NextRequest) => {
        // Your logic
        return NextResponse.json({});
    }
);
```

### 3. Manual Rate Limit Check

```typescript
export async function POST(req: NextRequest) {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(
        req,
        RATE_LIMIT_PRESETS.AUTH
    );

    if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
    }

    // Your API logic here
    return NextResponse.json({ success: true });
}
```

### 4. Multiple Rate Limits

```typescript
export async function POST(req: NextRequest) {
    // Check multiple limits (all must pass)
    const results = await Promise.all([
        checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH),
        checkRateLimit(req, { limit: 10, window: 60, identifier: 'custom-check' }),
    ]);

    const failed = results.find(r => !r.success);
    if (failed) {
        return createRateLimitResponse(failed);
    }

    // Your API logic
    return NextResponse.json({});
}
```

## Configuration

### Environment Variables

Required for production:
```bash
REDIS_REST_URL=https://your-redis.upstash.io
REDIS_REST_TOKEN=your-token
```

Optional rate limit overrides:
```bash
RATE_LIMIT_AUTH=5
RATE_LIMIT_AUTH_WINDOW=60
RATE_LIMIT_PUBLIC_API=100
RATE_LIMIT_PUBLIC_API_WINDOW=60
RATE_LIMIT_PAYMENT=10
RATE_LIMIT_PAYMENT_WINDOW=60
RATE_LIMIT_CREATE_EVENT=5
RATE_LIMIT_CREATE_EVENT_WINDOW=300
RATE_LIMIT_ADMIN=50
RATE_LIMIT_ADMIN_WINDOW=60
```

### Preset Configurations

| Preset | Limit | Window | Type | Use Case |
|--------|-------|--------|------|----------|
| AUTH | 5 | 60s | IP | Signup/Signin endpoints |
| PUBLIC_API | 100 | 60s | IP | Public endpoints |
| PAYMENT | 10 | 60s | User | Payment/booking endpoints |
| CREATE_EVENT | 5 | 300s (5min) | User | Event creation |
| ADMIN | 50 | 60s | User | Admin operations |

## Response Headers

All rate-limited responses include:

```
X-RateLimit-Limit: 100           # Maximum requests
X-RateLimit-Remaining: 95        # Requests remaining
X-RateLimit-Reset: 1704182400000 # Unix timestamp of reset
Retry-After: 45                  # Seconds to wait (on 429 only)
```

When rate limited (429 status):
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

## Security Features

### 1. IP-Based Rate Limiting
- Extracts IP from multiple headers for reliability:
  - `cf-connecting-ip` (Cloudflare)
  - `x-real-ip` (Nginx)
  - `x-forwarded-for` (Proxies)
- Takes first IP from `x-forwarded-for` to prevent spoofing
- Works behind load balancers and CDNs

### 2. User-Based Rate Limiting
- Extracts user ID from:
  - NextAuth session cookie
  - Authorization Bearer token
- More accurate for authenticated endpoints
- Prevents shared-IP abuse (e.g., office network)

### 3. Prevents Bypass Attempts
- **Parallel requests**: Atomic Redis operations prevent race conditions
- **IP spoofing**: Trusts proxy headers in correct priority order
- **Header spoofing**: Validates multiple headers before accepting IP
- **Distributed attacks**: Shared Redis counters across all instances

### 4. Edge Runtime Support
- Works in both Node.js and Edge runtimes
- Uses Upstash REST API (Edge-compatible)
- Falls back gracefully if Redis unavailable

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @upstash/redis @upstash/ratelimit
```

### 2. Create Upstash Redis Database
1. Go to https://console.upstash.com/
2. Create a free Redis database
3. Copy REST URL and Token
4. Add to environment variables

### 3. Configure Environment
Copy `.env.example.ratelimit` to your project and update:
```bash
cp .env.example.ratelimit .env
```

Add to `.env`:
```bash
REDIS_REST_URL=https://xxx.upstash.io
REDIS_REST_TOKEN=xxx
```

### 4. Deploy
Rate limiting works automatically once environment is configured.

## Testing

### 1. Test Rate Limit Locally

Without Redis configured (in-memory fallback):
```bash
# Send requests in a loop
for i in {1..110}; do
  curl http://localhost:3000/api/events
  echo "Request $i"
done
# Should see 429 after 100 requests
```

### 2. Test with Redis

Configure Redis and test distributed limits:
```bash
# From different IP addresses
curl https://your-app.com/api/events
curl https://your-app.com/api/events -H "X-Forwarded-For: 1.2.3.4"
curl https://your-app.com/api/events -H "X-Forwarded-For: 5.6.7.8"
```

### 3. Test User-Based Limits

```bash
# With authentication
curl https://your-app.com/api/bookings/free \
  -H "Cookie: next-auth.session-token=xxx"

# Without authentication (different limit)
curl https://your-app.com/api/bookings/free
```

## Monitoring

### Upstash Dashboard
Monitor rate limit metrics at:
https://console.upstash.com/redis/xxx/metrics

Look for:
- Redis connection errors
- Memory usage
- Request throughput
- Latency

### Application Logs
```typescript
// Rate limit warnings are logged automatically
[RateLimit] Redis error, falling back to in-memory: Error...
[RateLimit] No request context, skipping rate limit check
```

## Troubleshooting

### Issue: Rate limiting not working
**Cause**: Redis not configured correctly
**Solution**:
```bash
# Check environment variables
echo $REDIS_REST_URL
echo $REDIS_REST_TOKEN

# Verify Upstash database is active
# Check firewall rules allow outbound HTTPS
```

### Issue: All requests being blocked
**Cause**: Limit too low or window too short
**Solution**: Adjust environment variables:
```bash
RATE_LIMIT_PUBLIC_API=200
RATE_LIMIT_PUBLIC_API_WINDOW=60
```

### Issue: Rate limit resets too frequently
**Cause**: In-memory fallback in production
**Solution**: Ensure Redis is configured and accessible

### Issue: Different IPs getting same limit
**Cause**: Shared proxy or CDN
**Solution**: Use user-based rate limiting:
```typescript
{
    ...RATE_LIMIT_PRESETS.PUBLIC_API,
    userBased: true,  // Instead of ipBased: true
}
```

## Production Checklist

- [ ] Upstash Redis database created
- [ ] REDIS_REST_URL and REDIS_REST_TOKEN configured
- [ ] Rate limit limits reviewed and adjusted
- [ ] Monitoring setup on Upstash dashboard
- [ ] Error logging configured
- [ ] Backup rate limiting tested (Redis failure)
- [ ] Load tested with expected traffic
- [ ] CDN/proxy headers validated
- [ ] User-based limits implemented for critical endpoints

## Performance Impact

### Minimal Overhead
- Redis check: ~5-15ms (depending on region)
- In-memory check: <1ms
- No additional database queries
- No significant latency added

### Scalability
- Redis handles millions of keys efficiently
- Upstash auto-scales automatically
- No impact on Next.js serverless cold starts

## Cost Considerations

### Upstash Pricing (as of 2024)
- Free: 10,000 commands/day
- Pro: $4.99/month (500K commands/day)
- Scale: $49.99/month (10M commands/day)

### Estimation
For 100 req/min per user:
- 100 users: 14.4M req/day → Pro plan
- 1000 users: 144M req/day → Scale plan

**Recommendation**: Start with free tier, monitor usage, upgrade as needed.

## Tradeoffs and Edge Cases

### Edge Case 1: Multiple Users on Same IP
**Problem**: Office network, shared WiFi
**Solution**: Use user-based rate limiting for authenticated endpoints

### Edge Case 2: User Spoofs IP
**Problem**: User sets `X-Forwarded-For` header
**Solution**: Trust proxy headers in correct priority order, use CDN-level validation

### Edge Case 3: Redis Failure
**Problem**: Redis service goes down
**Solution**: Automatic fallback to in-memory (warn in logs, upgrade Redis plan)

### Edge Case 4: Clock Skew
**Problem**: Different servers have different times
**Solution**: Use Redis-based timestamps (not server time)

### Edge Case 5: Distributed Requests
**Problem**: Requests across multiple serverless instances
**Solution**: Shared Redis counter prevents bypass

## Future Enhancements

1. **Dynamic Rate Limits**
   - Adjust limits based on user tier (free vs premium)
   - Increase limits for trusted users
   - Decrease for suspicious activity

2. **Rate Limit Analytics**
   - Track most rate-limited IPs
   - Identify abuse patterns
   - Export metrics to monitoring tools

3. **Circuit Breaker**
   - Temporary ban for repeat offenders
   - Progressive penalties
   - Admin notification system

4. **Custom Key Strategies**
   - Rate limit by endpoint + user
   - Limit expensive operations differently
   - Tenant-aware limits for SaaS

## References

- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Upstash Ratelimit](https://upstash.com/docs/ratelimit)
- [OWASP Rate Limiting Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
