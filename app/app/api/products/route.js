import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize the server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 1. GET Request: Fetches products securely
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}

// 2. POST Request: Handles new listings securely
export async function POST(request) {
  try {
    const body = await request.json();

    // SERVER-SIDE VALIDATION (The Security Layer)
    if (!body.title || !body.price || !body.whatsapp_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Force strict rules (User cannot override these)
    const newProduct = {
      title: body.title,
      price: body.price,
      whatsapp_number: body.whatsapp_number.replace(/\D/g, ''), // Strip non-numbers
      campus: body.campus || 'UNILAG',
      item_type: body.item_type || 'Physical',
      images: body.images || ["https://placehold.co/600x600/008069/white?text=No+Photo"],
      is_admin_post: false, // Security: Always false for public API
      click_count: 0
    };

    const { data, error } = await supabase.from('products').insert([newProduct]).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
