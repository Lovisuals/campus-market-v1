import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Paystack } from 'paystack-sdk';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(req: Request) {
    if (!PAYSTACK_SECRET_KEY) {
        return NextResponse.json({ error: 'Config Error' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    try {
        const paystack = new Paystack(PAYSTACK_SECRET_KEY);
        const response = await paystack.transaction.verify(reference);

        if (!response.status || response.data.status !== 'success') {
            return NextResponse.json({ status: 'failed', message: 'Payment verification failed' });
        }

        // Return Data
        const amountPaid = response.data.amount / 100;
        const metadata = response.data.metadata;

        // DB Update
        const supabase = await createClient();

        // Update Transaction
        await supabase
            .from('transactions')
            .update({ status: 'success', metadata: response.data })
            .eq('reference', reference);

        // [Logic Hook] Activate Listing if applicable
        if (metadata?.listing_id) {
            await supabase
                .from('listings')
                .update({ status: 'active' }) // From 'pending_payment'
                .eq('id', metadata.listing_id);
        }

        // [Logic Hook] Send Receipt Email
        // We import dynamically or use fetch to internal API to avoid edge runtime issues if resend not compatible
        // But here we use the lib function we created
        try {
            const { sendEmail } = await import('@/lib/notifications/email');
            await sendEmail({
                to: response.data.customer.email,
                subject: 'Payment Receipt - Campus Market P2P',
                html: `
                    <h1>Payment Successful!</h1>
                    <p>Reference: ${reference}</p>
                    <p>Amount: ₦${amountPaid}</p>
                    <p>Your anonymous post is now live!</p>
                `
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
        }

        return NextResponse.json({ status: 'success', data: response.data });

    } catch (error) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
