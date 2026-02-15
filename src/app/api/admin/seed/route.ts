import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for seeding to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOCK_SELLERS = [
    { name: "Chinedu Okafor", campus: "UNILAG", phone: "+2348012345678" },
    { name: "Amina Yusuf", campus: "ABU Zaria", phone: "+2348023456789" },
    { name: "Olumide Adebayo", campus: "UI Ibadan", phone: "+2348034567890" },
    { name: "Blessing Effiong", campus: "UNIBEN", phone: "+2348045678901" },
    { name: "Tunde Williams", campus: "OAU Ife", phone: "+2348056789012" }
];

const MOCK_PRODUCTS = [
    { title: "MacBook Pro M1 (8/256GB)", price: 450000, category: "Electronics", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000" },
    { title: "Calculus Textbook (7th Ed)", price: 5000, category: "Books", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000" },
    { title: "Jollof Rice & Chicken Combo", price: 2500, category: "Food", img: "https://images.unsplash.com/photo-1567016507665-356928ac6679?q=80&w=1000" },
    { title: "iPhone 13 (Blue)", price: 320000, category: "Electronics", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000" },
    { title: "Student Desk Lamp", price: 8000, category: "Housing", img: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=1000" },
    { title: "Gym Resistance Bands", price: 12000, category: "Sports", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000" }
];

export async function POST(req: NextRequest) {
    try {
        const { count = 5 } = await req.json();

        const seededListings = [];

        for (let i = 0; i < count; i++) {
            const seller = MOCK_SELLERS[Math.floor(Math.random() * MOCK_SELLERS.length)];
            const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];

            // 1. Ensure a "Seed User" exists or use a generic one
            // For simplicity, we'll try to find or create a user with this name
            const { data: userData, error: userError } = await supabaseAdmin
                .from("users")
                .select("id")
                .eq("full_name", seller.name)
                .single();

            let userId;
            if (userData) {
                userId = userData.id;
            } else {
                // In a real scenario, we'd need a real auth user, 
                // but for seeding content, we can link to a system user or create one.
                // Since this is for demo/liquidity, we'll assume the users table can be populated.
                // WARNING: In Supabase, auth.users is separate. We'll skip user creation if not found
                // and fallback to a known admin ID if provided, or just error.
                continue;
            }

            // 2. Create Listing
            const { data: listing, error: listingError } = await supabaseAdmin
                .from("listings")
                .insert({
                    seller_id: userId,
                    title: product.title,
                    description: `${product.title} in great condition. Contact for pick up at ${seller.campus}.`,
                    price: product.price,
                    campus: seller.campus,
                    category: product.category,
                    image_url: product.img,
                    is_verified: true,
                    status: 'active',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (listing) seededListings.push(listing);
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${seededListings.length} listings successfully.`,
            data: seededListings
        });

    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
