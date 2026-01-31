import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalizePhoneNumber, isPhoneValid } from "./phone-validator";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// ============= FORMATTING UTILITIES =============

/**
 * Format currency to NGN
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDate(d);
};

/**
 * Truncate string to specified length
 */
export const truncateString = (str: string, length: number = 50): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// ============= VALIDATION UTILITIES =============

/**
 * Validate phone number format (delegated to phone-validator)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return isPhoneValid(phone, "NG");
};

/**
 * Normalize phone number (delegated to phone-validator)
 */
export const normalizePhone = (phone: string) => {
  return normalizePhoneNumber(phone, "NG");
};

/**
 * Check if price is within range
 */
export const isPriceInRange = (price: number, min?: number, max?: number): boolean => {
  if (min !== undefined && price < min) return false;
  if (max !== undefined && price > max) return false;
  return true;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};

// ============= UTILITY FUNCTIONS =============

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Sleep function (useful for testing)
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};