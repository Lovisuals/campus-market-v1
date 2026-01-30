// import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';

interface OtpRecord {
  code: string;
  expiresAt: Date;
  attempts: number;
  deviceHash: string;
  ipHash: string;
  createdAt: Date;
}

export async function generateOtp(
  userId: string,
  deviceFingerprint: string,
  ipAddress: string
): Promise<{ code: string; expiresIn: number }> {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
  const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

  await supabase
    .from('otp_sessions')
    .insert({
      user_id: userId,
      code: code,
      expires_at: expiresAt,
      attempts: 0,
      device_hash: deviceHash,
      ip_hash: ipHash,
      used: false,
      created_at: new Date()
    });

  return {
    code,
    expiresIn: 300
  };
}

export async function verifyOtp(
  userId: string,
  code: string,
  deviceFingerprint: string,
  ipAddress: string
): Promise<{ valid: boolean; error?: string }> {
  const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
  const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

  const { data: otpRecord, error } = await supabase
    .from('otp_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('device_hash', deviceHash)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpRecord) {
    return { valid: false, error: 'No active OTP found' };
  }

  if (new Date() > new Date(otpRecord.expires_at)) {
    return { valid: false, error: 'OTP expired' };
  }

  if (otpRecord.attempts >= 3) {
    await supabase
      .from('otp_sessions')
      .update({ attempts: 6 })
      .eq('id', otpRecord.id);

    return { valid: false, error: 'Max attempts exceeded' };
  }

  if (otpRecord.ip_hash !== ipHash) {
    return { valid: false, error: 'IP mismatch detected' };
  }

  if (otpRecord.code !== code) {
    await supabase
      .from('otp_sessions')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    return { valid: false, error: 'Invalid code' };
  }

  await supabase
    .from('otp_sessions')
    .update({ used: true, verified_at: new Date() })
    .eq('id', otpRecord.id);

  return { valid: true };
}
