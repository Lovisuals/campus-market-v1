import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendMessageSchema, validateSchema } from '@/lib/validation-schemas';
import { logSecurityEvent } from '@/lib/audit-logger';
import { moderateContent, checkUserBanStatus } from '@/lib/content-moderation';
import { encryptMessage } from '@/lib/message-encryption';
import { detectContactInfo } from '@/lib/security/chat-guard';
import * as Sentry from '@sentry/nextjs';

// Send message
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
        { reason: 'Attempted to send message while banned' }, req);
      return NextResponse.json({
        error: `Account banned: ${banStatus.reason}`
      }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validation = validateSchema(SendMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: (validation as { success: false; error: string }).error }, { status: 400 });
    }

    const { recipient_id, content, listing_id } = (validation as { success: true; data: any }).data;

    // Prevent self-messaging
    if (recipient_id === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Verify recipient exists and is not banned
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, is_banned')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    if (recipient.is_banned) {
      return NextResponse.json({ error: 'Recipient is unavailable' }, { status: 400 });
    }

    // Content moderation
    const moderation = await moderateContent(content, 'message');

    // [NEXUS SECURITY] Check for Contact Info (Phone/Email)
    const securityCheck = detectContactInfo(content);
    if (securityCheck.detected) {
      await logSecurityEvent(user.id, 'suspicious_activity',
        { reason: `Contact info sharing attempted: ${securityCheck.reason}` }, req);
      return NextResponse.json({
        error: securityCheck.reason
      }, { status: 400 }); // Return 400 Bad Request directly
    }

    if (moderation.autoBlock) {
      await logSecurityEvent(user.id, 'suspicious_activity',
        { reason: `Message auto-blocked: ${moderation.reasons.join(', ')}` }, req);
      return NextResponse.json({
        error: 'Message blocked due to policy violation'
      }, { status: 403 });
    }

    // Encrypt message content
    const encryptionKey = process.env.MESSAGE_ENCRYPTION_KEY || 'default-key-change-in-production-32chars';
    const { ciphertext, iv, authTag } = await encryptMessage(content, encryptionKey);

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        content: ciphertext,
        encryption_iv: iv,
        auth_tag: authTag,
        listing_id,
        flagged: moderation.flagged,
        flagged_reason: moderation.flagged ? moderation.reasons.join(', ') : null
      })
      .select(`
        *,
        sender:users!sender_id(id, full_name, campus),
        recipient:users!recipient_id(id, full_name, campus),
        listing:listings(id, title)
      `)
      .single();

    if (messageError) {
      Sentry.captureException(messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // If message was flagged, log for moderation
    if (moderation.flagged) {
      await supabase.from('moderation_queue').insert({
        content_type: 'message',
        content_id: message.id,
        user_id: user.id,
        reason: moderation.reasons[0],
        details: moderation.reasons.join(', '),
        severity: moderation.severity,
        auto_flagged: true
      });
    }

    return NextResponse.json({ message: { ...message, content } }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get messages (conversation)
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherId = searchParams.get('with');
    const listingId = searchParams.get('listing');

    if (!otherId) {
      return NextResponse.json({ error: 'Missing "with" parameter' }, { status: 400 });
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, full_name, campus),
        recipient:users!recipient_id(id, full_name, campus)
      `)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: messages, error } = await query;

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Decrypt messages (implemented in frontend for security)
    // Return encrypted messages - client will decrypt with shared key

    return NextResponse.json({ messages });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Message fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Internal helper for getting conversations list
async function getConversationsList(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest message from each conversation
    const { data: conversations, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, full_name, campus),
        recipient:users!recipient_id(id, full_name, campus),
        listing:listings(id, title)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Group by conversation partner and get latest message
    const conversationMap = new Map();

    conversations?.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner: msg.sender_id === user.id ? msg.recipient : msg.sender,
          lastMessage: msg,
          listing: msg.listing
        });
      }
    });

    const conversationList = Array.from(conversationMap.values());

    return NextResponse.json({ conversations: conversationList });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Conversations fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
