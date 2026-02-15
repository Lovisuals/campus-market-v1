import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { HARDCODED_ADMIN_PHONES } from "@/lib/admin";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { phone, deviceHash, ipHash, deviceSecret } = await req.json();

        // 1. Authorization Check
        if (!HARDCODED_ADMIN_PHONES.includes(phone)) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // 2. Device verification
        const { data: deviceData, error: deviceError } = await supabaseAdmin
            .from("user_devices")
            .select("user_id, device_secret")
            .eq("device_hash", deviceHash)
            .eq("ip_hash", ipHash)
            .single();

        if (deviceError || !deviceData || deviceData.device_secret !== deviceSecret) {
            return NextResponse.json({ error: "Device verification failed" }, { status: 401 });
        }

        // 3. Log the user in
        // For admin quick login, we generate a magic link and sign them in server-side 
        // or return a token if we had a custom auth provider. 
        // Since we use Supabase Auth, we'll use the service role to get the user's email
        // and then simulate a successful sign-in or use a magic link.

        const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .select("email")
            .eq("id", deviceData.user_id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate a short-lived login link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.email,
            options: {
                redirectTo: `${new URL(req.url).origin}/api/auth/callback`
            }
        });

        if (linkError) throw linkError;

        return NextResponse.json({
            success: true,
            redirectUrl: linkData.properties.action_link
        });

    } catch (error: any) {
        console.error("Admin quick login error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
