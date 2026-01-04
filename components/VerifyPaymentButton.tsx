'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerifyPaymentButtonProps {
    bookingId: string;
}

export default function VerifyPaymentButton({ bookingId }: VerifyPaymentButtonProps) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    const handleVerify = async () => {
        setIsVerifying(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/bookings/${bookingId}/verify-status`, {
                method: 'POST',
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Payment verified! Refreshing...' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.message || 'Verification failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while verifying' });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex-1 bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isVerifying ? 'Verifying...' : 'Verify Payment Status'}
            </button>
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-900/20 text-green-200' : 'bg-red-900/20 text-red-200'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}
