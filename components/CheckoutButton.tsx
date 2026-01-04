"use client";

import { toast } from "sonner";

export default function CheckoutButton({
    eventId,
    email,
}: {
    eventId: string;
    email: string;
}) {
    const handleCheckout = async () => {
        try {
            // @ts-ignore
            if (typeof window.Razorpay === 'undefined') {
                toast.error('Razorpay SDK not loaded. Please refresh and try again.');
                return;
            }

            const res = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, email }),
            });

            const data = await res.json();
            if (!data.success) {
                toast.error(data.message || "Payment failed");
                return;
            }

            console.log('Order created:', data.data);

            const options = {
                key: data.data.key,
                amount: data.data.amount,
                currency: data.data.currency,
                name: "Dev Events",
                order_id: data.data.orderId,
                handler: async (response: any) => {
                    console.log('🔍 Full Razorpay response:', JSON.stringify(response, null, 2));
                    const verifyBody = {
                        bookingId: data.data.bookingId,
                        razorpay_order_id: response.razorpay_order_id || data.data.orderId,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    };
                    console.log('📤 Sending verification:', verifyBody);
                    
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(verifyBody),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        window.location.href = `/booking-success/${data.data.bookingId}`;
                    } else {
                        toast.error("Payment verification failed: " + verifyData.message);
                    }
                },
                prefill: { email },
                theme: { color: "#FFD60A" },
                modal: {
                    ondismiss: function() {
                        console.log('Payment modal dismissed');
                    }
                },
                notes: {
                    bookingId: data.data.bookingId,
                },
            };

            console.log('🔧 Razorpay options:', options);
            // @ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.log('❌ Payment failed:', response);
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error("Error initiating payment");
        }
    };

    return (
        <>
            <button
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg"
            >
                Proceed to Payment
            </button>

            <script
                src="https://checkout.razorpay.com/v1/checkout.js"
                async
            />
        </>
    );
}
