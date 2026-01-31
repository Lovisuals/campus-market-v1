import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateReviewSchema, validateSchema } from '@/lib/validation-schemas';
import { moderateContent } from '@/lib/content-moderation';
import * as Sentry from '@sentry/nextjs';

// Submit a review/rating
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateSchema(CreateReviewSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { seller_id, transaction_id, rating, comment } = validation.data;

    // Verify transaction exists and user is the buyer
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, listing:listings(*)')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Only buyers can review' }, { status: 403 });
    }

    if (transaction.seller_id !== seller_id) {
      return NextResponse.json({ error: 'Seller mismatch' }, { status: 400 });
    }

    if (transaction.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Can only review completed transactions' 
      }, { status: 400 });
    }

    // Check if review already exists
    const { data: existing } = await supabase
      .from('seller_ratings')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'You have already reviewed this transaction' 
      }, { status: 409 });
    }

    // Moderate comment content
    const moderation = await moderateContent(comment, 'review');
    if (moderation.autoBlock) {
      return NextResponse.json({
        error: 'Review blocked due to policy violation'
      }, { status: 403 });
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('seller_ratings')
      .insert({
        seller_id,
        buyer_id: user.id,
        transaction_id,
        rating,
        review: comment
      })
      .select()
      .single();

    if (reviewError) {
      Sentry.captureException(reviewError);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      review,
      message: 'Thank you for your review!' 
    }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get reviews for a seller
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('seller_id');

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing seller_id parameter' }, { status: 400 });
    }

    // Get reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('seller_ratings')
      .select(`
        *,
        buyer:users!buyer_id(id, full_name, campus),
        transaction:transactions(listing_id, listings(title))
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      Sentry.captureException(reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get seller stats
    const { data: stats, error: statsError } = await supabase
      .from('seller_stats')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (statsError) {
      // Stats might not exist if no reviews yet
      return NextResponse.json({ 
        reviews: reviews || [], 
        stats: null 
      });
    }

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
