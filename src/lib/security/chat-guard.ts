
/**
 * Chat Guard: Safety & Retention Features
 * Detects off-platform contact attempts to ensure user safety and retention.
 */

export function detectContactInfo(text: string): { detected: boolean; reason?: string } {
    // 1. Nigerian Phone Numbers
    // Matches: 080..., 090..., 070..., 081..., +234..., 234...
    // Refined to catch spaced numbers: "0 8 0 1 2 3..."
    const phonePattern = /(\+?234|0)?[789][01]\d{8}|(\d\s*){11}/;

    // 2. Email Addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    // 3. Social Handles (Basic check for @username mentions, though restrictive)
    // const socialPattern = /@[\w\d_.]+/; 

    if (phonePattern.test(text.replace(/\s+/g, ''))) { // concise check removing spaces
        return { detected: true, reason: "Sharing phone numbers is not allowed. Please use the secure chat." };
    }

    if (emailPattern.test(text)) {
        return { detected: true, reason: "Sharing email addresses is prohibited." };
    }

    return { detected: false };
}
