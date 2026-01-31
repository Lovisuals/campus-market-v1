import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  country: string;
  carrier?: string;
  formatted: string;
  error?: string;
}

/**
 * Validates and normalizes phone numbers to E.164 format
 * Supports Nigerian numbers and other international formats
 */
export function normalizePhoneNumber(
  phoneInput: string,
  countryCode: CountryCode | string = 'NG'
): PhoneValidationResult {
  try {
    const input = phoneInput.trim();

    if (!input) {
      return {
        valid: false,
        normalized: '',
        country: String(countryCode),
        formatted: '',
        error: 'Phone number is empty'
      };
    }

    const parsed = parsePhoneNumber(input, countryCode as CountryCode);

    if (!parsed) {
      return {
        valid: false,
        normalized: input,
        country: String(countryCode),
        formatted: input,
        error: `Invalid phone number for ${countryCode}`
      };
    }

    return {
      valid: true,
      normalized: parsed.format('E.164'),
      country: parsed.country || countryCode,
      formatted: parsed.formatInternational(),
      error: undefined
    };
  } catch (error) {
    return {
      valid: false,
      normalized: phoneInput,
      country: countryCode,
      formatted: phoneInput,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Legacy function for backward compatibility
 */
export function validateAndNormalizePhone(
  input: string,
  defaultCountry: CountryCode | string = 'NG'
): PhoneValidationResult {
  return normalizePhoneNumber(input, defaultCountry);
}

/**
 * Quick check if a phone number is valid
 */
export function isPhoneValid(phoneInput: string, countryCode: CountryCode | string = 'NG'): boolean {
  try {
    return isValidPhoneNumber(phoneInput, countryCode as CountryCode);
  } catch {
    return false;
  }
}

/**
 * Nigerian telecom operators and their prefixes
 */
export const NIGERIAN_OPERATORS = {
  MTN: ['701', '702', '703', '704', '705', '706', '707', '708', '709'],
  AIRTEL: ['801', '802', '808', '810', '811', '812'],
  GLO: ['805', '807'],
  NTEL: ['804'],
  SMILE: ['220'],
  VISAFONE: ['898', '899']
};

/**
 * Detect Nigerian telecom operator from phone number
 */
export function getOperator(phoneNumber: string): string | null {
  const normalized = normalizePhoneNumber(phoneNumber, 'NG');

  if (!normalized.valid) return null;

  try {
    const parsed = parsePhoneNumber(normalized.normalized, 'NG' as CountryCode);
    if (!parsed?.nationalNumber) return null;

    const digits = String(parsed.nationalNumber);
    const prefix = digits.substring(0, 3);

    for (const [operator, prefixes] of Object.entries(NIGERIAN_OPERATORS)) {
      if (prefixes.includes(prefix)) {
        return operator;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Interface for batch validation results
 */
export interface BatchPhoneValidation {
  valid: string[];
  invalid: Array<{ phone: string; error: string }>;
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
  };
}

/**
 * Validate multiple phone numbers in batch
 */
export function validatePhoneBatch(
  phones: string[],
  countryCode: string = 'NG'
): BatchPhoneValidation {
  const valid: string[] = [];
  const invalid: Array<{ phone: string; error: string }> = [];

  phones.forEach(phone => {
    const result = normalizePhoneNumber(phone, countryCode);
    if (result.valid) {
      valid.push(result.normalized);
    } else {
      invalid.push({
        phone,
        error: result.error || 'Invalid phone'
      });
    }
  });

  return {
    valid,
    invalid,
    summary: {
      total: phones.length,
      validCount: valid.length,
      invalidCount: invalid.length
    }
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string, countryCode: string = 'NG'): string {
  const result = normalizePhoneNumber(phoneNumber, countryCode);
  return result.valid ? result.formatted : phoneNumber;
}

/**
 * Check if phone number is from Nigeria
 */
export function isNigerianNumber(phoneNumber: string): boolean {
  const result = normalizePhoneNumber(phoneNumber, 'NG');
  return result.valid && result.country === 'NG';
}

export const SUPPORTED_FORMATS = {
  NG: [
    /^(\+234|0)[789]\d{9}$/,
    /^\+234[789]\d{9}$/,
    /^234[789]\d{9}$/
  ]
};

export function validatePhoneLocal(phone: string): boolean {
  return SUPPORTED_FORMATS.NG.some(regex => regex.test(phone.replace(/\s/g, '')));
}
