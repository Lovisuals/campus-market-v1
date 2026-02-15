import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Paystack } from 'paystack-sdk';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
    if (!PAYSTACK_SECRET_KEY) {
        return NextResponse.json({ error: 'Payment Service Configuration Error' }, { status: 503 });
    }

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, amount, purpose, listing_id } = await req.json();

        if (!amount || !email) {
            return NextResponse.json({ error: 'Amount and Email required' }, { status: 400 });
        }

        // Initialize Paystack
        const paystack = new Paystack(PAYSTACK_SECRET_KEY);

        const response = await paystack.transaction.initialize({
            email,
            amount: (amount * 100).toString(), // Convert to kobo and stringify
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
            metadata: {
                user_id: user.id,
                purpose: purpose || 'general',
                listing_id: listing_id || null
            }
        });

        if (!response.status) {
            return NextResponse.json({ error: response.message }, { status: 400 });
        }

        // Log transaction to DB (Pending state)
        const { error: dbError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                reference: response.data.reference,
                amount: amount,
                status: 'pending',
                purpose: purpose || 'general'
            });

        if (dbError) {
            console.error('DB Transaction Log Error:', dbError);
            // We proceed anyway since Paystack init succeeded, but this is risky
        }

        return NextResponse.json({
            authorization_url: response.data.authorization_url,
            reference: response.data.reference
        });

    } catch (error) {
        console.error('Payment Init Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
