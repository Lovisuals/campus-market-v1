"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function vouchForUser(targetUserId: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        if (user.id === targetUserId) {
            return { success: false, error: "You cannot vouch for yourself." };
        }

        // 1. Check if Voucher is Verified
        const { data: voucherProfile, error: profileError } = await supabase
            .from('users')
            .select('verification_status')
            .eq('id', user.id)
            .single();

        if (profileError || !voucherProfile) throw new Error("Could not fetch profile");

        if (voucherProfile.verification_status !== 'verified') {
            return { success: false, error: "Only verified students can vouch for others." };
        }

        // 2. Insert Vouch
        const { error: insertError } = await supabase
            .from('vouches')
            .insert({
                voucher_id: user.id,
                receiver_id: targetUserId
            });

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                return { success: false, error: "You have already vouched for this student." };
            }
            throw insertError;
        }

        revalidatePath(`/profile/${targetUserId}`);
        return { success: true };

    } catch (error) {
        console.error("Vouch error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to vouch"
        };
    }
}
