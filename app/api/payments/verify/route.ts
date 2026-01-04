import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        console.log('Verify request received:', { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature });

        if (!bookingId || !razorpay_payment_id) {
            console.error('Missing required payment details');
            return NextResponse.json({ success: false, message: 'Missing required payment details' }, { status: 400 });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error(`Booking not found: ${bookingId}`);
            return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
        }

        console.log(`Booking found. Current status: ${booking.paymentStatus}`);

        const orderId = razorpay_order_id || booking.razorpayOrderId;
        if (!orderId) {
            console.error('Missing order ID');
            return NextResponse.json({ success: false, message: 'Missing order ID' }, { status: 400 });
        }

        if (booking.paymentStatus === 'paid') {
            console.log(`Booking ${bookingId} already paid`);
            return NextResponse.json({ success: true, message: 'Already paid' });
        }

        if (booking.paymentStatus === 'failed') {
            console.log(`Booking ${bookingId} already failed`);
            return NextResponse.json({ success: false, message: 'Payment already failed' }, { status: 400 });
        }

        if (razorpay_signature) {
            const body = `${orderId}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(body)
                .digest('hex');

            console.log('Signature verification:', {
                expected: expectedSignature,
                received: razorpay_signature,
                match: expectedSignature === razorpay_signature
            });

            if (expectedSignature !== razorpay_signature) {
                console.error('Invalid signature');
                booking.paymentStatus = 'failed';
                await booking.save();
                return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
            }
        }

        try {
            console.log('Fetching payment from Razorpay...');
            let payment = await razorpay.payments.fetch(razorpay_payment_id);

            console.log('Payment status from Razorpay:', payment.status);

            // Capture payment if it's authorized but not captured
            if (payment.status === 'authorized') {
                console.log('Payment is authorized, capturing...');
                payment = await razorpay.payments.capture(razorpay_payment_id, payment.amount, payment.currency);
                console.log('Payment captured:', payment.status);
            }

            if (payment.status !== 'captured') {
                console.error(`Payment not captured, status: ${payment.status}`);
                booking.paymentStatus = 'failed';
                await booking.save();
                return NextResponse.json({ success: false, message: 'Payment not captured' }, { status: 400 });
            }

            const paymentAmount = (payment.amount as number) / 100;
            const bookingAmount = booking.amount as number | undefined;
            if (bookingAmount && Math.abs(paymentAmount - bookingAmount) > 0.01) {
                console.error(`Amount mismatch: payment=${paymentAmount}, booking=${bookingAmount}`);
                booking.paymentStatus = 'failed';
                await booking.save();
                return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 });
            }

            console.log('Payment verified successfully. Updating booking...');
        } catch (apiError) {
            console.error('Razorpay API verification failed:', apiError);
            return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 500 });
        }

        booking.paymentStatus = 'paid';
        booking.razorpayOrderId = orderId;
        booking.razorpayPaymentId = razorpay_payment_id;
        await booking.save();

        console.log(`✅ Booking ${bookingId} marked as paid`);
        
        if (!razorpay_signature) {
            console.warn('⚠️ Payment verified without signature (using API fallback)');
        }
        
        return NextResponse.json({ success: true, message: 'Payment verified and booking confirmed' });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
