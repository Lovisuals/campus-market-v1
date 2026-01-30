import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  country: string;
  error?: string;
}

export function validateAndNormalizePhone(
  input: string,
  defaultCountry: string = 'NG'
): PhoneValidationResult {
  try {
    const cleaned = input.trim().replace(/\s/g, '');

    const parsed = parsePhoneNumber(cleaned, defaultCountry);

    if (!parsed || !isValidPhoneNumber(cleaned, defaultCountry)) {
      return {
        valid: false,
        normalized: cleaned,
        country: defaultCountry,
        error: 'Invalid phone format'
      };
    }

    return {
      valid: true,
      normalized: parsed.format('E.164'),
      country: parsed.country || defaultCountry,
      error: undefined
    };
  } catch (err) {
    return {
      valid: false,
      normalized: input,
      country: defaultCountry,
      error: 'Phone parsing failed'
    };
  }
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
