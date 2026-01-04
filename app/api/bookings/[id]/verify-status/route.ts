import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/database';
import connectDB from '@/lib/mongodb';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const booking = await Booking.findById(id).lean();

        if (!booking) {
            return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
        }

        if (booking.paymentStatus === 'paid') {
            return NextResponse.json({ success: true, message: 'Already paid', status: booking.paymentStatus });
        }

        if (booking.paymentStatus === 'failed') {
            return NextResponse.json({ success: false, message: 'Payment failed', status: booking.paymentStatus });
        }

        if (!booking.razorpayOrderId) {
            return NextResponse.json({ success: false, message: 'No Razorpay order found' }, { status: 400 });
        }

        try {
            const order = await razorpay.orders.fetch(booking.razorpayOrderId);

            if (order.status === 'paid') {
                const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);

                if (payments.items && payments.items.length > 0) {
                    const payment = payments.items[0];

                    if (payment.status === 'captured') {
                        await Booking.findByIdAndUpdate(id, {
                            paymentStatus: 'paid',
                            razorpayPaymentId: payment.id,
                        });

                        console.log(`Booking ${id} verified via manual check - marked as paid`);

                        return NextResponse.json({
                            success: true,
                            message: 'Payment verified successfully',
                            status: 'paid'
                        });
                    }
                }

                await Booking.findByIdAndUpdate(id, {
                    paymentStatus: 'failed',
                });

                return NextResponse.json({
                    success: false,
                    message: 'Order paid but payment not captured',
                    status: 'failed'
                });
            }

            if (order.status === 'created' || order.status === 'attempted') {
                return NextResponse.json({
                    success: false,
                    message: `Payment is ${order.status}. Please wait or try again.`,
                    status: 'pending'
                });
            }

            await Booking.findByIdAndUpdate(id, {
                paymentStatus: 'failed',
            });

            return NextResponse.json({
                success: false,
                message: 'Payment failed or expired',
                status: 'failed'
            });

        } catch (apiError) {
            console.error('Razorpay API error:', apiError);
            return NextResponse.json({
                success: false,
                message: 'Unable to verify payment status',
                status: 'unknown'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Verify status error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
