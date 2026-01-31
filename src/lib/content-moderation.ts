import { createClient } from '@/lib/supabase/server';

// Comprehensive list of banned words/phrases
const BANNED_WORDS = [
  'scam', 'scammer', 'fraud', 'fraudster', 'fake', 'counterfeit',
  'stolen', 'hack', 'hacked', 'cheat', 'cheater', 'ponzi',
  'pyramid scheme', 'mlm', 'get rich quick', 'bitcoin scam',
  'investment opportunity', 'guaranteed profit', 'double your money',
  'wire transfer', 'western union', 'moneygram', 'gift card payment',
  'send nudes', 'sex', 'porn', 'xxx', 'prostitute', 'escort',
  'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'pills',
  'weapon', 'gun', 'knife', 'explosive', 'bomb'
];

const SUSPICIOUS_PATTERNS = [
  /\b\d{16}\b/, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
  /bitcoin.*address/i,
  /send.*money.*urgent/i,
  /guaranteed.*\$\d+/i,
  /100%.*profit/i
];

export interface ModerationResult {
  flagged: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  autoBlock: boolean;
}

export async function moderateContent(
  content: string,
  contentType: 'listing' | 'message' | 'review' | 'profile'
): Promise<ModerationResult> {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let autoBlock = false;

  const lowerContent = content.toLowerCase();

  // Check banned words
  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word)) {
      reasons.push(`Contains banned word: ${word}`);
      
      if (['stolen', 'ponzi', 'bomb', 'weapon'].some(w => word.includes(w))) {
        severity = 'critical';
        autoBlock = true;
      } else if (['scam', 'fraud', 'hack'].some(w => word.includes(w))) {
        severity = 'high';
      } else {
        severity = severity === 'low' ? 'medium' : severity;
      }
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      reasons.push(`Suspicious pattern detected: ${pattern.source}`);
      severity = severity === 'low' ? 'high' : 'critical';
    }
  }

  // Check for excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    reasons.push('Excessive capital letters');
    severity = severity === 'low' ? 'low' : severity;
  }

  // Check for repeated characters (spam indicator)
  if (/(.)\1{5,}/.test(content)) {
    reasons.push('Repeated characters (spam indicator)');
    severity = severity === 'low' ? 'medium' : severity;
  }

  // Check for excessive punctuation
  const punctuationRatio = (content.match(/[!?@#$%]/g) || []).length / content.length;
  if (punctuationRatio > 0.2) {
    reasons.push('Excessive punctuation');
    severity = severity === 'low' ? 'low' : severity;
  }

  const flagged = reasons.length > 0;

  // Log to moderation queue if flagged
  if (flagged) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('moderation_queue').insert({
          content_type: contentType,
          content_id: crypto.randomUUID(), // Will be updated with actual ID
          user_id: user.id,
          reason: reasons[0],
          details: reasons.join(', '),
          severity,
          auto_flagged: true
        });
      }
    } catch (error) {
      console.error('Failed to log to moderation queue:', error);
    }
  }

  return {
    flagged,
    severity,
    reasons,
    autoBlock
  };
}

export async function checkUserBanStatus(userId: string): Promise<{
  isBanned: boolean;
  reason?: string;
  bannedUntil?: Date;
}> {
  const supabase = await createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('is_banned, ban_reason, banned_until')
    .eq('id', userId)
    .single();

  if (!user) {
    return { isBanned: false };
  }

  // Check if temporary ban has expired
  if (user.is_banned && user.banned_until) {
    const bannedUntil = new Date(user.banned_until);
    if (bannedUntil < new Date()) {
      // Unban user
      await supabase
        .from('users')
        .update({ is_banned: false, ban_reason: null, banned_until: null })
        .eq('id', userId);
      
      return { isBanned: false };
    }
  }

  return {
    isBanned: user.is_banned || false,
    reason: user.ban_reason || undefined,
    bannedUntil: user.banned_until ? new Date(user.banned_until) : undefined
  };
}

export async function reportContent(
  reporterId: string,
  reason: string,
  description: string,
  target: {
    userId?: string;
    listingId?: string;
    messageId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('user_reports').insert({
      reporter_id: reporterId,
      reported_user_id: target.userId,
      reported_listing_id: target.listingId,
      reported_message_id: target.messageId,
      reason,
      description,
      status: 'pending'
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Report submission failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit report' 
    };
  }
}
