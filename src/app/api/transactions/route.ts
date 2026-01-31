import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateTransactionSchema, UpdateTransactionStatusSchema, validateSchema } from '@/lib/validation-schemas';
import { logTransactionAction, logSecurityEvent } from '@/lib/audit-logger';
import { moderateContent, checkUserBanStatus } from '@/lib/content-moderation';
import * as Sentry from '@sentry/nextjs';

// Create new transaction
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is banned
    const banStatus = await checkUserBanStatus(user.id);
    if (banStatus.isBanned) {
      await logSecurityEvent(user.id, 'unauthorized_access', 
        { reason: 'Attempted transaction while banned' }, req);
      return NextResponse.json({ 
        error: `Account banned: ${banStatus.reason}` 
      }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateSchema(CreateTransactionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: (validation as { success: false; error: string }).error }, { status: 400 });
    }

    const { listing_id, amount, payment_method } = (validation as { success: true; data: any }).data;

    // Verify listing exists and is available
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*, seller:users!seller_id(*)')
      .eq('id', listing_id)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found or unavailable' }, { status: 404 });
    }

    // Prevent self-purchase
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });
    }

    // Verify amount matches listing price
    if (amount !== listing.price) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        listing_id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount,
        payment_method,
        status: 'pending'
      })
      .select()
      .single();

    if (txError) {
      Sentry.captureException(txError, { extra: { listing_id, user_id: user.id } });
      return NextResponse.json({ error: 'Transaction creation failed' }, { status: 500 });
    }

    // Update listing status
    await supabase
      .from('listings')
      .update({ status: 'pending' })
      .eq('id', listing_id);

    // Log audit event
    await logTransactionAction(user.id, 'create', transaction.id, {
      listing_id,
      amount,
      payment_method
    }, req);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update transaction status
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateSchema(UpdateTransactionStatusSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: (validation as { success: false; error: string }).error }, { status: 400 });
    }

    const { transaction_id, status, notes } = (validation as { success: true; data: any }).data;

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, listing:listings(*)')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user is buyer or seller
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      await logSecurityEvent(user.id, 'unauthorized_access',
        { reason: 'Attempted to update unauthorized transaction' }, req);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      'pending': ['completed', 'cancelled', 'disputed'],
      'disputed': ['completed', 'refunded'],
      'completed': [],
      'cancelled': [],
      'refunded': []
    };

    if (!validTransitions[transaction.status]?.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${transaction.status} to ${status}` 
      }, { status: 400 });
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status, notes })
      .eq('id', transaction_id);

    if (updateError) {
      Sentry.captureException(updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Update listing status based on transaction status
    if (status === 'completed') {
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', transaction.listing_id);
    } else if (status === 'cancelled') {
      await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', transaction.listing_id);
    }

    // Log audit event
    await logTransactionAction(user.id, 'update', transaction_id, {
      old_status: transaction.status,
      new_status: status,
      notes
    }, req);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Transaction update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get transactions
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'buying' or 'selling'

    let query = supabase
      .from('transactions')
      .select(`
        *,
        listing:listings(*),
        buyer:users!buyer_id(id, full_name, campus),
        seller:users!seller_id(id, full_name, campus)
      `)
      .order('created_at', { ascending: false });

    if (type === 'buying') {
      query = query.eq('buyer_id', user.id);
    } else if (type === 'selling') {
      query = query.eq('seller_id', user.id);
    } else {
      query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Transaction fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
