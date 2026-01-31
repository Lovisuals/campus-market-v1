import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listingRateLimiter, listingRateLimiterByIP } from "@/lib/rateLimiter";
import { notifyAdminsOfNewListing } from "@/lib/notifications";
import { CreateListingSchema, validateSchema } from "@/lib/validation-schemas";
import * as Sentry from "@sentry/nextjs";

// Add security headers to all responses
const addSecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
};

// Input sanitization to prevent XSS
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>\"'`]/g, '')
    .trim()
    .substring(0, 1000);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = validateSchema(CreateListingSchema, body);
    if (!validation.success) {
      return addSecurityHeaders(
        NextResponse.json({ error: (validation as { success: false; error: string }).error }, { status: 400 })
      );
    }
    
    const {
      title,
      description,
      category,
      price,
      campus,
      condition,
      images,
    } = validation.data;

    const supabase = await createServerClient();

    // Validate session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      const response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      return addSecurityHeaders(response);
    }

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Rate limiting by user ID and IP
    try {
      await listingRateLimiter.consume(session.user.id);
      await listingRateLimiterByIP.consume(ip);
    } catch (rejRes) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Check phone_verified from users table
    const { data: userRow } = await supabase.from("users").select("phone_verified").eq("id", session.user.id).single();
    if (!userRow?.phone_verified) {
      return NextResponse.json({ error: "Phone not verified" }, { status: 403 });
    }

    // Abuse protection: Check for duplicate titles by same user in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentListings } = await supabase
      .from('listings')
      .select('title')
      .eq('seller_id', session.user.id)
      .gte('created_at', oneDayAgo);

    if (recentListings?.some(listing => listing.title.toLowerCase() === title.toLowerCase())) {
      return NextResponse.json({ error: "Duplicate listing title. Please choose a different title." }, { status: 400 });
    }

    // Validate images count
    if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
      return NextResponse.json({ error: "Images must be between 1 and 3" }, { status: 400 });
    }

    // Validate each image metadata in storage
    const bucket = "listing-images";
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (const path of images) {
      // Normalize path: strip leading slashes
      const storagePath = path.startsWith("/") ? path.slice(1) : path;
      // getMetadata may not be present on some SDK typings; use dynamic access
      const { data: meta, error: metaError } = await (supabase.storage.from(bucket) as any).getMetadata(storagePath as string);
      if (metaError || !meta) {
        return NextResponse.json({ error: `Image not found in storage: ${storagePath}` }, { status: 400 });
      }
      if (!meta.mimetype?.startsWith("image/")) {
        return NextResponse.json({ error: `Invalid image type for ${storagePath}` }, { status: 400 });
      }
      if ((meta.size || 0) > MAX_SIZE) {
        return NextResponse.json({ error: `Image too large: ${storagePath}` }, { status: 400 });
      }
    }

    // Check if user is admin
    const { data: adminUserRow } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single();
    const isAdminUser = !!adminUserRow?.is_admin;

    // Insert listing - require admin approval (NOT auto-approved)
    const { data: inserted, error: insertError } = await supabase.from("listings").insert([
      {
        seller_id: session.user.id,
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        category: sanitizeInput(category),
        price: isRequest ? null : price,
        budget: isRequest ? price : null,
        campus: sanitizeInput(campus),
        condition: sanitizeInput(condition),
        is_request: isRequest,
        is_approved: false,
        is_verified: isAdminUser,
        status: "pending_approval",
        views: 0,
        saved_count: 0,
        currency: "NGN",
        images: images,
      },
    ]).select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Notify admins if listing is not from admin
    if (!isAdminUser) {
      await notifyAdminsOfNewListing(inserted[0]);
    }

    const response = NextResponse.json({ data: inserted }, { status: 201 });
    return addSecurityHeaders(response);
  } catch (err) {
    console.error("/api/listings error", err);
    // Don't expose internal errors to client
    const response = NextResponse.json({ error: "An error occurred while creating the listing" }, { status: 500 });
    return addSecurityHeaders(response);
  }
}
