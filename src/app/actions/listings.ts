'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { moderateContent } from '@/lib/nexus/moderation-guard';

export interface CreateListingData {
    title: string;
    description: string;
    price: string;
    category: string;
    listingType: 'sell' | 'buy';
    isAnonymous: boolean;
    images?: string[];
}

export async function createListing(data: CreateListingData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '0.0.0.0';

    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        // [PHASE 11] Check Daily Post Limit (5 per day)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .gte('created_at', startOfDay.toISOString());

        if (countError) throw countError;

        let visibility: 'public' | 'profile_only' | 'flagged' = (count || 0) >= 5 ? 'profile_only' : 'public';

        // [PHASE 11] AI Content Guard (Groq)
        try {
            const aiResult = await moderateContent(data.title, data.description || "");
            if (aiResult.flagged) {
                visibility = 'flagged';
            }
        } catch (aiErr) {
            console.error("AI Guard Error:", aiErr);
        }

        const initialStatus = data.isAnonymous ? 'pending_payment' : 'active';

        const { data: listing, error } = await supabase
            .from('listings')
            .insert({
                seller_id: user.id,
                title: data.title,
                description: data.description,
                price: parseFloat(data.price),
                category: data.category,
                listing_type: data.listingType,
                is_anonymous: data.isAnonymous,
                campus: user.user_metadata.campus || 'General',
                status: initialStatus,
                image_url: data.images?.[0] || null,
                ip_address: ip,
                visibility: visibility
            })
            .select()
            .single();

        if (error) {
            console.error('Listing Creation Error:', error);
            return { error: error.message };
        }

        revalidatePath('/market');
        return { success: true, listing, visibility };

    } catch (error) {
        console.error('Server Action Error:', error);
        return { error: 'Internal Server Error' };
    }
}

