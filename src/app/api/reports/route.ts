import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateReportSchema, validateSchema } from '@/lib/validation-schemas';
import { logSecurityEvent } from '@/lib/audit-logger';
import { checkUserBanStatus } from '@/lib/content-moderation';
import * as Sentry from '@sentry/nextjs';

// Submit a report
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
      return NextResponse.json({
        error: 'Banned users cannot submit reports'
      }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateSchema(CreateReportSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: (validation as { success: false; error: string }).error }, { status: 400 });
    }

    const { reported_user_id, listing_id, reason, description } = (validation as { success: true; data: any }).data;

    // Verify at least one target is provided
    if (!reported_user_id && !listing_id) {
      return NextResponse.json({ 
        error: 'Must specify what to report' 
      }, { status: 400 });
    }

    // Prevent self-reporting
    if (reported_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    // Check for duplicate reports (same user, same target, within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let duplicateQuery = supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .gte('created_at', oneDayAgo);

    if (reported_user_id) duplicateQuery = duplicateQuery.eq('reported_user_id', reported_user_id);
    if (listing_id) duplicateQuery = duplicateQuery.eq('reported_listing_id', listing_id);

    const { data: existing } = await duplicateQuery.single();

    if (existing) {
      return NextResponse.json({ 
        error: 'You already reported this recently. Please wait for moderation review.' 
      }, { status: 429 });
    }

    // Insert report
    const { data: report, error: reportError } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id,
        reported_listing_id: listing_id,
        reason,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (reportError) {
      Sentry.captureException(reportError);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    // Log security event for high-severity reasons
    if (['fraud', 'harassment', 'stolen'].includes(reason)) {
      await logSecurityEvent(user.id, 'suspicious_activity', {
        action: 'report_submitted',
        reason,
        target_user: reported_user_id,
        target_listing: listing_id
      }, req);
    }

    return NextResponse.json({ 
      success: true,
      report_id: report.id,
      message: 'Report submitted successfully. Our team will review it shortly.' 
    }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Report submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's submitted reports
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reports, error } = await supabase
      .from('user_reports')
      .select(`
        *,
        reported_user:users!reported_user_id(id, full_name, campus),
        reported_listing:listings!reported_listing_id(id, title),
        reported_message:messages!reported_message_id(id, content)
      `)
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
