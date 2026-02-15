import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  country: string;
  formatted: string;
  error?: string;
}

export function normalizePhoneNumber(
  phoneInput: string,
  countryCode: CountryCode = 'NG'
): PhoneValidationResult {
  try {
    const input = phoneInput.trim();

    if (!input) {
      return {
        valid: false,
        normalized: '',
        country: countryCode,
        formatted: '',
        error: 'Phone number is empty'
      };
    }

    const parsed = parsePhoneNumber(input, countryCode);

    if (!parsed) {
      return {
        valid: false,
        normalized: input,
        country: countryCode,
        formatted: input,
        error: `Invalid phone number for ${countryCode}`
      };
    }

    if (!parsed.isValid()) {
      return {
        valid: false,
        normalized: input,
        country: countryCode,
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

export function isPhoneValid(phoneInput: string, countryCode: CountryCode = 'NG'): boolean {
  try {
    return isValidPhoneNumber(phoneInput, countryCode);
  } catch {
    return false;
  }
}

export const NIGERIAN_OPERATORS = {
  MTN: ['701', '702', '703', '704', '705', '706', '707', '708', '709'],
  AIRTEL: ['801', '802', '808', '810', '811', '812'],
  GLO: ['805', '807'],
  NTEL: ['804'],
  SMILE: ['220'],
  VISAFONE: ['898', '899'],
  '9MOBILE': ['809', '817', '818', '909', '908']
};

export function getOperator(phoneNumber: string): string | null {
  const normalized = normalizePhoneNumber(phoneNumber, 'NG');

  if (!normalized.valid) return null;

  const parsed = parsePhoneNumber(normalized.normalized, 'NG');
  if (!parsed?.nationalNumber) return null;

  const digits = String(parsed.nationalNumber);
  const prefix = digits.substring(0, 3);

  for (const [operator, prefixes] of Object.entries(NIGERIAN_OPERATORS)) {
    if (prefixes.includes(prefix)) {
      return operator;
    }
  }

  return null;
}
