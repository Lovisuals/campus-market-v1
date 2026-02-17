import { NextRequest, NextResponse } from "next/server";
import { HARDCODED_ADMIN_PHONES } from "@/lib/admin";
import { normalizePhoneNumber } from "@/lib/phone-validator";
import { generateMagicToken } from "@/lib/jwt";

/**
 * ADMIN DIRECT ACCESS
 * Admin enters phone number → verified against hardcoded list → JWT issued → redirect to admin.
 * No Supabase Auth, no OTP, no Twilio needed.
 */
export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        // Normalize the phone
        const validation = normalizePhoneNumber(phone, 'NG');
        if (!validation.valid) {
            return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
        }

        // Check both formats against the admin list
        const raw = validation.normalized.replace(/[+\s\-]/g, '');
        const isAdmin = HARDCODED_ADMIN_PHONES.some(p => {
            const normalizedAdmin = p.replace(/[+\s\-]/g, '');
            return normalizedAdmin === raw ||
                normalizedAdmin === raw.replace(/^234/, '0') ||
                raw === normalizedAdmin.replace(/^234/, '0') ||
                `234${normalizedAdmin.replace(/^0/, '')}` === raw ||
                `234${raw.replace(/^0/, '')}` === `234${normalizedAdmin.replace(/^0/, '')}`;
        });

        if (!isAdmin) {
            return NextResponse.json({ error: "This number is not authorized for admin access" }, { status: 403 });
        }

        // Generate a signed JWT token for admin access
        const token = await generateMagicToken(validation.normalized, 'admin');

        return NextResponse.json({
            success: true,
            token,
            redirectUrl: `/admin/god-mode?key=${token}`,
        });

    } catch (error: any) {
        console.error("Admin direct access error:", error);
        return NextResponse.json({ error: error.message || "Access failed" }, { status: 500 });
    }
}
