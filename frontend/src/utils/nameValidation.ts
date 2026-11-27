/* src/utils/nameValidation.ts */
// Shared rules for "Full Name" fields: alphabetic characters (A–Z, a–z) and dots
// (for initials, e.g. "A.B. Perera"), with single spaces allowed between name parts.

const NON_ALPHA = /[^A-Za-z.\s]/g;
const FULL_NAME_PATTERN = /^[A-Za-z][A-Za-z.]*(?: [A-Za-z.]+)*$/;

/** Strips any characters other than letters, dots and spaces as the user types and collapses repeated spaces. */
export const sanitizeFullName = (value: string): string =>
  value.replace(NON_ALPHA, '').replace(/\s+/g, ' ').replace(/^\s+/, '');

/** True when the (trimmed) name starts with a letter and contains only letters, dots and single spaces. */
export const isValidFullName = (value: string): boolean =>
  FULL_NAME_PATTERN.test(value.trim());

export const FULL_NAME_ERROR = 'Full Name may contain alphabetic characters, dots and spaces only.';
