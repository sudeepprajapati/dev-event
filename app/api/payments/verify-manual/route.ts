import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { bookingId, razorpay_payment_id } = await req.json();

        if (!bookingId || !razorpay_payment_id) {
            return NextResponse.json({ success: false, message: 'Missing bookingId or razorpay_payment_id' }, { status: 400 });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
        }

        console.log(`Verifying payment manually: ${razorpay_payment_id}`);

        let payment = await razorpay.payments.fetch(razorpay_payment_id);
        console.log('Payment from Razorpay (initial):', payment.status, JSON.stringify(payment, null, 2));

        // Capture payment if it's authorized but not captured
        if (payment.status === 'authorized') {
            console.log('Payment is authorized, capturing...');
            payment = await razorpay.payments.capture(razorpay_payment_id, payment.amount, payment.currency);
            console.log('Payment captured:', payment.status);
        }

        if (payment.status !== 'captured') {
            return NextResponse.json({ success: false, message: `Payment not captured, status: ${payment.status}` }, { status: 400 });
        }

        const paymentAmount = (payment.amount as number) / 100;
        const bookingAmount = booking.amount as number | undefined;
        if (bookingAmount && Math.abs(paymentAmount - bookingAmount) > 0.01) {
            return NextResponse.json({ success: false, message: `Amount mismatch: payment=${paymentAmount}, booking=${bookingAmount}` }, { status: 400 });
        }

        if (payment.order_id !== booking.razorpayOrderId) {
            console.warn(`Order ID mismatch: payment.order_id=${payment.order_id}, booking.razorpayOrderId=${booking.razorpayOrderId}`);
        }

        booking.paymentStatus = 'paid';
        booking.razorpayPaymentId = razorpay_payment_id;
        await booking.save();

        console.log(`✅ Booking ${bookingId} manually verified and marked as paid`);
        
        return NextResponse.json({ success: true, message: 'Payment manually verified and booking confirmed' });
    } catch (error) {
        console.error('Manual verification error:', error);
        return NextResponse.json({ success: false, message: 'Manual verification failed' }, { status: 500 });
    }
}
