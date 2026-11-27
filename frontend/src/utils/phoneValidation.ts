/* src/utils/phoneValidation.ts */
// Shared rules for "Mobile Number" / "Landline Number" fields: digits only, 10 digits.

export const PHONE_LENGTH = 10;

/** Strips non-digit characters as the user types and caps the value at 10 digits. */
export const sanitizePhone = (value: string): string =>
  value.replace(/\D/g, '').slice(0, PHONE_LENGTH);

/** True when the value is exactly 10 digits. */
export const isValidPhone = (value: string): boolean =>
  new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(value.trim());

export const MOBILE_ERROR = `Mobile Number must be exactly ${PHONE_LENGTH} digits.`;
export const LANDLINE_ERROR = `Landline Number must be exactly ${PHONE_LENGTH} digits.`;
