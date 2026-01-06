# Rate Limiting Module

Production-grade rate limiting for Next.js 16 App Router with Upstash Redis.

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install @upstash/redis @upstash/ratelimit
   ```

2. **Configure environment variables** in `.env`:
   ```bash
   REDIS_REST_URL=https://your-redis-instance.upstash.io
   REDIS_REST_TOKEN=your-redis-token-here
   ```

3. **Apply to your API routes**:
   ```typescript
   import { checkRateLimit, createRateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

   export async function POST(req: NextRequest) {
       const rateLimitResult = await checkRateLimit(req, RATE_LIMIT_PRESETS.AUTH);
       if (!rateLimitResult.success) {
           return createRateLimitResponse(rateLimitResult);
       }
       // Your logic here...
   }
   ```

## Features

- ✅ **Distributed**: Works across all serverless instances
- ✅ **Production-safe**: Uses Redis, not in-memory storage
- ✅ **Flexible**: IP-based and user-based limits
- ✅ **Configurable**: Customize limits per endpoint
- ✅ **Standards-compliant**: Proper HTTP 429 with Retry-After header
- ✅ **Edge-ready**: Works in Edge and Node runtimes
- ✅ **Graceful fallback**: In-memory fallback for development
- ✅ **Anti-bypass**: Prevents spoofing and race conditions

## Architecture

```
Request → Rate Limit Check → Redis/Upstash → Allow/Deny
                 ↓
           Returns 429 if exceeded
           Adds headers to all responses
```

## Preset Limits

| Preset | Limit | Window | Type | Protected Endpoints |
|--------|-------|--------|------|-------------------|
| AUTH | 5 | 60s | IP | Signup, Signin |
| PUBLIC_API | 100 | 60s | IP | GET /api/events, public APIs |
| PAYMENT | 10 | 60s | User | /api/payments/*, /api/bookings/free |
| CREATE_EVENT | 5 | 300s | User | POST /api/events |
| ADMIN | 50 | 60s | User | /api/admin/* |

## Files Structure

```
lib/rate-limit/
├── index.ts              # Main exports
├── redis.ts              # Redis client and utilities
├── rate-limiter.ts       # Core rate limiting logic
├── middleware.ts         # Helper functions and presets
└── examples.ts           # Usage examples

.env.example.ratelimit   # Environment variables template
docs/RATE_LIMITING.md     # Full documentation
```

## Currently Protected Endpoints

- ✅ `POST /api/events` - Event creation (5 per 5min per user)
- ✅ `GET /api/events` - Public events listing (100 per min per IP)
- ✅ `POST /api/payments/create-order` - Payment order creation (10 per min per user)
- ✅ `POST /api/bookings/free` - Free event booking (10 per min per user)

## Endpoints to Protect

Apply rate limiting to:

1. **Admin endpoints** (`/api/admin/*`)
   - Use `RATE_LIMIT_PRESETS.ADMIN`
   - Already have authentication checks

2. **Auth endpoints** (if custom)
   - Use `RATE_LIMIT_PRESETS.AUTH`
   - NextAuth handles some rate limiting internally

3. **Other public endpoints**
   - Use `RATE_LIMIT_PRESETS.PUBLIC_API`
   - Or custom limits as needed

## Testing

### Locally (no Redis)
```bash
# Send 101 requests
for i in {1..101}; do curl http://localhost:3000/api/events; done

# Should see 429 after 100 requests
```

### With Redis
```bash
# Test from different IPs
curl https://your-app.com/api/events
curl https://your-app.com/api/events -H "X-Forwarded-For: 1.2.3.4"

# Test user-based limits
curl https://your-app.com/api/bookings/free \
  -H "Cookie: next-auth.session-token=xxx"
```

## Monitoring

1. **Upstash Dashboard**:
   - https://console.upstash.com/redis/xxx/metrics
   - Monitor connections, memory, throughput

2. **Application Logs**:
   ```
   [RateLimit] Redis client initialized
   [RateLimit] Redis error, falling back to in-memory: ...
   ```

3. **Response Headers** (check in browser dev tools):
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 95
   X-RateLimit-Reset: 1704182400000
   Retry-After: 45  (on 429 only)
   ```

## Security Considerations

### Prevents:
- ✅ Brute-force attacks on auth endpoints
- ✅ API scraping and abuse
- ✅ Payment endpoint abuse
- ✅ Spam event creation
- ✅ DDoS-like behavior
- ✅ Infrastructure cost spikes

### IP-Based Limiting
- Extracts IP from multiple headers (Cloudflare, Nginx, proxies)
- Takes first IP from `X-Forwarded-For` (prevents spoofing)
- Works behind CDN/proxies

### User-Based Limiting
- Uses NextAuth session token or Bearer token
- More accurate for authenticated endpoints
- Prevents shared-IP abuse (office, school)

### Anti-Bypass
- Atomic Redis operations prevent race conditions
- Distributed counters prevent instance-hopping
- Header validation prevents spoofing

## Troubleshooting

### Rate limiting not working?
1. Check Redis configuration:
   ```bash
   echo $REDIS_REST_URL
   echo $REDIS_REST_TOKEN
   ```

2. Check environment is loaded:
   - Vercel: Set in project settings
   - Local: Restart server after updating `.env`

3. Check Upstash database is active

### Too strict limits?
Adjust in `.env`:
```bash
RATE_LIMIT_PUBLIC_API=200
RATE_LIMIT_PUBLIC_API_WINDOW=60
```

### All requests blocked?
1. Redis connection failed (check logs)
2. Limit too low for your traffic
3. Different IP/user each request (proxy issues)

## Performance

- **Redis check**: ~5-15ms (depending on region)
- **In-memory check**: <1ms
- **No additional DB queries**
- **Minimal latency impact**

## Costs

Upstash free tier: 10K commands/day
- 100 req/min × 1440 min = 144K req/day
- Need Pro plan ($4.99/mo) for production

See full cost analysis in `docs/RATE_LIMITING.md`

## Documentation

- [Full Implementation Guide](docs/RATE_LIMITING.md)
- [Usage Examples](lib/rate-limit/examples.ts)
- [Upstash Redis](https://upstash.com/docs/redis)
- [Upstash Ratelimit](https://upstash.com/docs/ratelimit)

## Production Deployment Checklist

- [ ] Redis configured (`REDIS_REST_URL`, `REDIS_REST_TOKEN`)
- [ ] Rate limits reviewed and adjusted
- [ ] All critical endpoints protected
- [ ] Testing in production environment
- [ ] Monitoring setup on Upstash
- [ ] Alerts configured for high rate limit hits
- [ ] Load tested with expected traffic
- [ ] CDN/proxy headers validated
- [ ] Backup strategy tested (Redis failure)

## Support

For issues or questions:
1. Check `docs/RATE_LIMITING.md` for detailed guides
2. See `lib/rate-limit/examples.ts` for code examples
3. Review Upstash documentation
4. Check application logs for errors

## License

Part of the DevEvents application.
