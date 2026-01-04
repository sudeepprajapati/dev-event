# Payment Stuck in "Processing" - Fix

## Problem

Booking success page shows "Processing Payment" even after clicking "Refresh Status". The booking remains stuck in `pending` state indefinitely.

## Root Causes

### 1. **Checkout Handler Doesn't Wait for Verification**

**File: `app/(user)/checkout/[slug]/page.tsx` (Lines 169-180)**

```typescript
// BEFORE - The problem:
handler: async (response: any) => {
    await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookingId: data.data.bookingId,
            ...response,
        }),
    });

    // ❌ Redirects IMMEDIATELY without checking verify response
    window.location.href = `/booking-success/${data.data.bookingId}`;
},
```

**Issues:**
- No error handling if verify fails
- Redirects to success page regardless of verification result
- User sees "Processing" even if payment failed

### 2. **Webhook Not Working on Localhost**

Razorpay webhooks require a publicly accessible URL:
- `http://localhost:3000` ❌ - Razorpay cannot reach localhost
- `https://your-app.vercel.app` ✅ - Works
- `https://abc123.ngrok-free.app` ✅ - Works for local dev

Without webhook, only the client-side verification matters, which has issue #1 above.

### 3. **No Manual Verification Option**

Users had no way to manually trigger payment verification after the initial attempt fails.

## Solutions Implemented

### 1. **Created Manual Verification Endpoint**

**File: `app/api/bookings/[id]/verify-status/route.ts` (NEW)**

```typescript
// Manually check payment status with Razorpay API
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const booking = await Booking.findById(id);

    if (booking.paymentStatus === 'paid') {
        return NextResponse.json({ success: true, message: 'Already paid' });
    }

    const order = await razorpay.orders.fetch(booking.razorpayOrderId);

    if (order.status === 'paid') {
        const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);

        if (payments.items?.[0]?.status === 'captured') {
            await Booking.findByIdAndUpdate(id, {
                paymentStatus: 'paid',
                razorpayPaymentId: payment.id,
            });
            return NextResponse.json({ success: true, message: 'Payment verified' });
        }
    }

    return NextResponse.json({ success: false, message: 'Payment not captured' });
}
```

### 2. **Created Verify Payment Button Component**

**File: `components/VerifyPaymentButton.tsx` (NEW)**

```typescript
export default function VerifyPaymentButton({ bookingId }: VerifyPaymentButtonProps) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleVerify = async () => {
        setIsVerifying(true);

        const res = await fetch(`/api/bookings/${bookingId}/verify-status`, {
            method: 'POST',
        });

        const data = await res.json();

        if (data.success) {
            setMessage({ type: 'success', text: 'Payment verified! Refreshing...' });
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setMessage({ type: 'error', text: data.message || 'Verification failed' });
        }

        setIsVerifying(false);
    };

    return (
        <button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify Payment Status'}
        </button>
    );
}
```

### 3. **Updated Booking Success Page**

**File: `app/(user)/booking-success/[slug]/page.tsx`**

```typescript
// BEFORE:
<RefreshButton className="flex-1 bg-primary ..." />

// AFTER:
<VerifyPaymentButton bookingId={safeBooking._id} />
```

### 4. **Fixed Checkout Handler**

**File: `app/(user)/checkout/[slug]/page.tsx`**

```typescript
// BEFORE:
handler: async (response: any) => {
    await fetch('/api/payments/verify', { ... });
    window.location.href = `/booking-success/${bookingId}`; // ❌ Always redirects
},

// AFTER:
handler: async (response: any) => {
    try {
        const verifyRes = await fetch('/api/payments/verify', { ... });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
            // ✅ Only redirect if verification succeeded
            window.location.href = `/booking-success/${bookingId}`;
        } else {
            // ❌ Show error and stay on page
            alert(`Payment verification failed: ${verifyData.message}`);
            btn.disabled = false;
            btn.textContent = 'Proceed to Payment';
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert('Payment completed but verification failed. Use manual verify button.');
        window.location.href = `/booking-success/${bookingId}`;
    }
},
```

### 5. **Added Debug Logging**

**File: `app/api/payments/verify/route.ts`**

Added comprehensive logging to track:
- Request parameters
- Booking lookup results
- Signature verification
- Payment status from Razorpay
- Amount verification

```typescript
console.log('Verify request received:', { bookingId, razorpay_order_id });
console.log(`Booking found. Current status: ${booking.paymentStatus}`);
console.log('Signature verification:', { match: expectedSignature === razorpay_signature });
console.log('Payment status from Razorpay:', payment.status);
console.log(`✅ Booking ${bookingId} marked as paid`);
```

## How It Works Now

### Normal Flow (Webhook Working)

```
User pays
    ↓
Razorpay captures payment
    ↓
[OPTIONAL] Client verify updates to "paid" (instant UX)
    ↓
[GUARANTEED] Webhook updates to "paid" (retries)
    ↓
User sees "Booking Confirmed" page
```

### With Manual Verification (Webhook Not Working)

```
User pays
    ↓
Client verify fails or webhook doesn't fire
    ↓
User sees "Processing" page
    ↓
User clicks "Verify Payment Status" button
    ↓
Server checks Razorpay API for payment status
    ↓
If paid: Updates booking, user sees "Payment verified! Refreshing..."
    ↓
Page reloads, shows "Booking Confirmed"
```

## Testing

### Test Scenario 1: Successful Payment

1. Go to `/checkout/event-slug`
2. Complete payment in Razorpay
3. Client verifies payment
4. **Expected**: Redirects to `/booking-success/id` with "Booking Confirmed"

### Test Scenario 2: Stuck Payment

1. Complete payment
2. Navigate to `/booking-success/id`
3. See "Processing Payment" message
4. Click "Verify Payment Status"
5. **Expected**: Shows "Payment verified! Refreshing..." then reloads to show success

### Test Scenario 3: Failed Payment

1. Start payment, close browser (simulate failure)
2. Navigate to `/booking-success/id`
3. See "Processing Payment"
4. Click "Verify Payment Status"
5. **Expected**: Shows error message explaining payment status

### Test Scenario 4: Webhook with ngrok (Local Dev)

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Expose localhost
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok-free.app)
# Configure webhook at Razorpay Dashboard:
# - URL: https://abc123.ngrok-free.app/api/payments/webhook
# - Events: payment.captured, order.paid, payment.failed
```

## Important Notes

### 1. **Webhook is Still the Source of Truth**

Even with manual verification:
- Webhook is still the primary mechanism
- Manual verify is just a fallback
- Both can fire safely (idempotent)

### 2. **Local Development**

On localhost, webhook won't work without ngrok:
- Use ngrok for testing webhook
- Use manual verify button for convenience
- Deploy to get real webhook functionality

### 3. **Production Deployment**

On production (Vercel/Railway/etc):
- Configure webhook with your real domain
- Webhook will handle most updates automatically
- Manual verify is still available as fallback

## Troubleshooting

### Booking Still Stuck After Manual Verify?

1. **Check browser console** for API errors
2. **Check server logs** (terminal) for verification output:
   ```bash
   # Should see logs like:
   Verify request received: { bookingId: '...', ... }
   Payment status from Razorpay: captured
   ✅ Booking ... marked as paid
   ```

3. **Check Razorpay Dashboard**:
   - Go to Payments section
   - Find your payment by date
   - Check if status is "Captured"

4. **Check booking in database**:
   ```javascript
   db.bookings.findOne({ _id: ObjectId("...") })
   // Check: paymentStatus, razorpayOrderId, razorpayPaymentId
   ```

### Verify Button Not Working?

1. Check if booking ID is correct (URL path)
2. Check browser console for errors
3. Check Network tab for API response
4. Ensure `/api/bookings/[id]/verify-status` exists

### Webhook Not Firing?

1. **Local dev**: Need ngrok (Razorpay can't reach localhost)
2. **Production**: Check webhook configuration in Razorpay Dashboard
3. **Check webhook secret**: Must match `RAZORPAY_WEBHOOK_SECRET` in `.env.local`

## Files Changed

### New Files
1. `components/VerifyPaymentButton.tsx` - Manual verify button
2. `app/api/bookings/[id]/verify-status/route.ts` - Manual verify API

### Updated Files
1. `app/(user)/booking-success/[slug]/page.tsx` - Use VerifyPaymentButton
2. `app/(user)/checkout/[slug]/page.tsx` - Handle verify response
3. `app/api/payments/verify/route.ts` - Add debug logging

## Next Steps

### For Local Development

1. Install ngrok: `npm install -g ngrok`
2. Expose your server: `ngrok http 3000`
3. Configure webhook in Razorpay Dashboard with ngrok URL
4. Test payment flow

### For Production Deployment

1. Deploy your app (Vercel, Railway, etc.)
2. Get your production URL
3. Configure webhook in Razorpay Dashboard:
   - URL: `https://your-app.com/api/payments/webhook`
   - Secret: Add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`
4. Test payment flow

### Alternative: Disable Manual Verify After Webhook Works

Once webhook is working reliably, you can optionally hide the manual verify button and rely only on:
- Client-side verify (instant UX)
- Webhook (guaranteed update)

## Summary

**Problem**: Bookings stuck in "pending" because:
1. Checkout didn't wait for verify response
2. No manual verification option
3. Webhook not working (localhost or misconfigured)

**Solution**:
1. ✅ Added error handling to checkout flow
2. ✅ Created manual verification button
3. ✅ Created manual verification API
4. ✅ Added comprehensive logging
5. ✅ Updated success page to use new button

**Result**:
- Users can manually trigger verification if stuck
- Clear error messages
- Detailed logging for debugging
- Idempotent operations
