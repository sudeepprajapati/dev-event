import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ success: false, message: 'Missing signature' }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return NextResponse.json({ success: false, message: 'Webhook not configured' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(bodyText)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(bodyText);

        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const payment = event.payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const razorpayPaymentId = payment.id;
            const amount = payment.amount / 100;

            await connectDB();

            const booking = await Booking.findOne({ razorpayOrderId });

            if (!booking) {
                console.error(`Booking not found for razorpayOrderId: ${razorpayOrderId}`);
                return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
            }

            if (booking.paymentStatus === 'paid') {
                return NextResponse.json({ success: true, message: 'Already processed' });
            }

            booking.paymentStatus = 'paid';
            booking.razorpayPaymentId = razorpayPaymentId;
            booking.amount = amount;

            await booking.save();

            console.log(`Booking ${booking._id} marked as paid via webhook`);
            return NextResponse.json({ success: true, message: 'Payment verified' });
        }

        if (event.event === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const razorpayOrderId = payment.order_id;

            await connectDB();

            const booking = await Booking.findOne({ razorpayOrderId });

            if (booking && booking.paymentStatus === 'pending') {
                booking.paymentStatus = 'failed';
                await booking.save();
                console.log(`Booking ${booking._id} marked as failed via webhook`);
            }

            return NextResponse.json({ success: true, message: 'Payment failure recorded' });
        }

        return NextResponse.json({ success: true, message: 'Event ignored' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ success: false, message: 'Webhook processing failed' }, { status: 500 });
    }
}
