/**
 * ADMIN HARDENING LIST
 * These credentials always have administrative access.
 */
export const HARDCODED_ADMIN_EMAILS = [
    "mail.lovisuals@gmail.com",
    "vitalbytesventures@gmial.com",
    "olawalopeyemi18@gmail.com"
];

export const HARDCODED_ADMIN_PHONES = [
    "08083000771",
    "09153095464",
    "+2348083000771",
    "+2349153095464"
];

/**
 * Checks if a user should be treated as an admin.
 * @param email User's email address
 * @param phone User's phone number
 * @param dbIsAdmin The is_admin flag from the database
 * @returns boolean
 */
export function checkIsAdmin(email?: string | null, phone?: string | null, dbIsAdmin: boolean = false): boolean {
    // 1. Check Database Flag
    if (dbIsAdmin) return true;

    // 2. Check Hardcoded Emails
    if (email && HARDCODED_ADMIN_EMAILS.includes(email.toLowerCase())) {
        return true;
    }

    // 3. Check Hardcoded Phones
    if (phone) {
        // Normalize phone for comparison (remove spaces/dashes)
        const normalizedPhone = phone.replace(/[\s\-]/g, '');
        if (HARDCODED_ADMIN_PHONES.includes(normalizedPhone)) {
            return true;
        }
    }

    return false;
}
