import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/jwt";

/**
 * Verify an admin JWT token and return the payload.
 * Used by the dashboard to authenticate phone-based admin access.
 */
export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const payload = await verifyMagicToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        return NextResponse.json({
            is_admin: payload.is_admin || false,
            phone: payload.phone || null,
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
