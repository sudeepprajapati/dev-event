"use client";

export default function CheckoutButton({
    eventId,
    email,
}: {
    eventId: string;
    email: string;
}) {
    const handleCheckout = async () => {
        try {
            const res = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, email }),
            });

            const data = await res.json();
            if (!data.success) {
                alert(data.message || "Payment failed");
                return;
            }

            const options = {
                key: data.data.key,
                amount: data.data.amount,
                currency: data.data.currency,
                name: "Dev Events",
                order_id: data.data.orderId,
                handler: async (response: any) => {
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            bookingId: data.data.bookingId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        window.location.href = `/booking-success/${data.data.bookingId}`;
                    } else {
                        alert("Payment verification failed");
                    }
                },
                prefill: { email },
                theme: { color: "#FFD60A" },
            };

            // @ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            alert("Error initiating payment");
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
