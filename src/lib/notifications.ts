import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { HARDCODED_ADMIN_EMAILS, HARDCODED_ADMIN_PHONES } from '@/lib/admin';

// Initialize services (will be configured with env vars)
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

const twilioClient = twilioAccountSid && twilioAuthToken
  ? twilio(twilioAccountSid, twilioAuthToken)
  : null;

export interface NotificationPayload {
  type: 'new_listing' | 'admin_approval' | 'user_verification';
  listingId?: string;
  userId?: string;
  title?: string;
  sellerName?: string;
  campus?: string;
}

export async function queueNotification(
  recipient: string,
  type: string,
  payload: NotificationPayload
) {
  const supabase = await createServerClient();

  const { error } = await supabase.from('notifications').insert({
    recipient,
    type,
    payload,
  });

  if (error) {
    console.error('Failed to queue notification:', error);
  }
}

export async function notifyAdminsOfNewListing(listing: any) {
  const supabase = await createServerClient();

  // Get all admin users
  const { data: admins } = await supabase
    .from('users')
    .select('email, phone')
    .eq('is_admin', true);

  if (!admins || admins.length === 0) return;

  const payload: NotificationPayload = {
    type: 'new_listing',
    listingId: listing.id,
    userId: listing.seller_id,
    title: listing.title,
    sellerName: 'New Seller', // Could fetch from users table
    campus: listing.campus,
  };

  // Queue notifications for each admin
  const allAdminEmails = new Set([...(admins?.map(a => a.email) || []), ...HARDCODED_ADMIN_EMAILS]);
  const allAdminPhones = new Set([...(admins?.map(a => a.phone) || []), ...HARDCODED_ADMIN_PHONES]);

  for (const email of allAdminEmails) {
    if (email) await queueNotification(email, 'email', payload);
  }
  for (const phone of allAdminPhones) {
    if (phone) await queueNotification(phone, 'sms', payload);
  }
}

export async function sendQueuedNotifications() {
  const supabase = await createServerClient();

  // Get unsent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('sent', false)
    .limit(10); // Process in batches

  if (!notifications) return;

  for (const notification of notifications) {
    try {
      if (notification.type === 'email' && sendgridApiKey) {
        await sendEmail(notification.recipient, notification.payload);
      } else if (notification.type === 'sms' && twilioClient) {
        await sendSMS(notification.recipient, notification.payload);
      }

      // Mark as sent
      await supabase
        .from('notifications')
        .update({ sent: true })
        .eq('id', notification.id);

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

async function sendEmail(to: string, payload: NotificationPayload) {
  const msg = {
    to,
    from: 'noreply@campusmarket.com', // Configure this
    subject: getEmailSubject(payload),
    text: getEmailText(payload),
    html: getEmailHtml(payload),
  };

  await sgMail.send(msg);
}

async function sendSMS(to: string, payload: NotificationPayload) {
  if (!twilioClient || !twilioPhoneNumber) return;

  await twilioClient.messages.create({
    body: getSMSText(payload),
    from: twilioPhoneNumber,
    to,
  });
}

function getEmailSubject(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'new_listing':
      return `New Listing: ${payload.title} - ${payload.campus}`;
    case 'admin_approval':
      return 'Your listing has been approved!';
    default:
      return 'Campus Market Notification';
  }
}

function getEmailText(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'new_listing':
      return `A new listing "${payload.title}" has been posted on Campus Market at ${payload.campus}. Please review it in the admin panel.`;
    case 'admin_approval':
      return 'Congratulations! Your listing has been approved and is now live on Campus Market.';
    default:
      return 'You have a new notification from Campus Market.';
  }
}

function getEmailHtml(payload: NotificationPayload): string {
  // Simple HTML version - can be enhanced
  return `<div>${getEmailText(payload)}</div>`;
}

function getSMSText(payload: NotificationPayload): string {
  switch (payload.type) {
    case 'new_listing':
      return `New listing: ${payload.title} at ${payload.campus}. Check admin panel.`;
    case 'admin_approval':
      return 'Your Campus Market listing has been approved!';
    default:
      return 'New Campus Market notification.';
  }
}
