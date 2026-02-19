/**
 * Admin Auth Helper
 * 
 * Provides unified auth check for pages that need to work with both:
 * - Supabase session (regular users via email)
 * - Admin JWT token (phone-based admin access via localStorage)
 */

const ADMIN_TOKEN_KEY = "campus_admin_token";
const ADMIN_USER_KEY = "campus_admin_user";

export interface AdminUser {
    id: string;
    phone: string;
    is_admin: boolean;
}

/** Store admin token + user info after phone login */
export function storeAdminAuth(token: string, user: AdminUser) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

/** Get stored admin token */
export function getAdminToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

/** Get stored admin user */
export function getAdminUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

/** Check if current session is admin (either Supabase or JWT) */
export function isAdminLoggedIn(): boolean {
    const user = getAdminUser();
    return !!user?.is_admin;
}

/** Clear admin auth (logout) */
export function clearAdminAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
}

/**
 * Get a synthetic user ID for admin.
 * Used when admin needs to perform actions that require a user ID
 * (posting listings, sending messages, etc.)
 */
export function getAdminUserId(): string | null {
    const user = getAdminUser();
    // Use phone hash as a stable ID for admin
    if (user?.phone) {
        return `admin-${user.phone.replace(/\+/g, "")}`;
    }
    return user?.id || null;
}
