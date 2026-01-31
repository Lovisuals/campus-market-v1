import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent({
  userId,
  action,
  targetType,
  targetId,
  changes,
  ipAddress,
  userAgent,
  metadata
}: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();

    const details: Record<string, any> = {};
    
    if (targetType) details.target_type = targetType;
    if (targetId) details.target_id = targetId;
    if (changes) details.changes = changes;
    if (metadata) details.metadata = metadata;

    await supabase.from('audit_log').insert({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should never break application flow
  }
}

// Convenience functions for common audit actions

export async function logUserAction(
  userId: string,
  action: 'login' | 'logout' | 'register' | 'profile_update' | 'password_change',
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `user_${action}`,
    metadata,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined
  });
}

export async function logListingAction(
  userId: string,
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject',
  listingId: string,
  changes?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `listing_${action}`,
    targetType: 'listing',
    targetId: listingId,
    changes,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined
  });
}

export async function logTransactionAction(
  userId: string,
  action: 'create' | 'update' | 'complete' | 'cancel' | 'refund',
  transactionId: string,
  changes?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `transaction_${action}`,
    targetType: 'transaction',
    targetId: transactionId,
    changes,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined
  });
}

export async function logAdminAction(
  adminId: string,
  action: 'verify_user' | 'ban_user' | 'unban_user' | 'delete_listing' | 'resolve_report' | 'issue_strike',
  targetType: 'user' | 'listing' | 'report' | 'transaction',
  targetId: string,
  reason?: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId: adminId,
    action: `admin_${action}`,
    targetType,
    targetId,
    metadata: reason ? { reason } : undefined,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined
  });
}

export async function logSecurityEvent(
  userId: string,
  event: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access',
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `security_${event}`,
    metadata,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined
  });
}

// Query functions for audit logs

export async function getUserAuditHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch audit history:', error);
    return [];
  }

  return data || [];
}

export async function getRecentAdminActions(
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('audit_log')
    .select('*, users!inner(full_name, email)')
    .like('action', 'admin_%')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch admin actions:', error);
    return [];
  }

  return data || [];
}
