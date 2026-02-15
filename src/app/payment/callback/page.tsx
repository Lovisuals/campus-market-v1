"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reference = searchParams.get('reference');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

    useEffect(() => {
        if (!reference) {
            setStatus('failed');
            return;
        }

        const verifyPayment = async () => {
            try {
                const res = await fetch(`/api/payments/verify?reference=${reference}`);
                const data = await res.json();

                if (data.status === 'success') {
                    setStatus('success');
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [reference]);

    return (
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center shadow-2xl">

            {status === 'loading' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-nexus-primary animate-spin mb-4" />
                    <h2 className="text-xl font-bold dark:text-white">Verifying Payment...</h2>
                    <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center text-green-500">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 mb-8">Your anonymous post is now live on the market.</p>
                    <Button
                        onClick={() => router.push('/market')}
                        className="w-full bg-nexus-primary hover:bg-indigo-600 text-white rounded-xl h-12 font-bold"
                    >
                        Return to Market
                    </Button>
                </div>
            )}

            {status === 'failed' && (
                <div className="flex flex-col items-center text-red-500">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Payment Failed</h2>
                    <p className="text-gray-500 mb-8">We couldn't verify your transaction. Any deducted funds will be reversed shortly.</p>
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/post')}
                            className="flex-1 rounded-xl h-12"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => router.push('/market')}
                            className="flex-1 bg-gray-900 text-white rounded-xl h-12"
                        >
                            Home
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-gray-500" />}>
                <PaymentCallbackContent />
            </Suspense>
        </div>
    );
}
