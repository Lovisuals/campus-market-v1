import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('Resend API Key missing. Skipping email.');
        return { success: false, error: 'Config Error' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Campus Market P2P <notifications@campusmarket.ng>', // Valid sender required
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Exception:', error);
        return { success: false, error };
    }
}
