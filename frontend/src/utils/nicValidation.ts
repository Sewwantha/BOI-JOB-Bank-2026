/* src/utils/nicValidation.ts */
// Sri Lankan NIC numbers:
//   old format: 9 digits + V/X, e.g. 951480234V  (YY DDD SSS C V)
//   new format: 12 digits,      e.g. 199514802345 (YYYY DDD SSSS C)
// DDD is the day of the birth year, +500 for females.

export const NIC_MAX_LENGTH = 12;
const NIC_PATTERN = /^(\d{9}[VX]|\d{12})$/;

export const NIC_ERROR = 'NIC number must be 9 digits followed by V or X (old format) or 12 digits (new format).';

/** Keeps up to 12 digits, or 9 digits + V/X (upper-cased), dropping anything else as the user types. */
export const sanitizeNic = (value: string): string => {
  let out = '';
  for (const ch of value.toUpperCase()) {
    if (/[VX]$/.test(out) || out.length >= NIC_MAX_LENGTH) break;
    if (/\d/.test(ch)) out += ch;
    else if ((ch === 'V' || ch === 'X') && out.length === 9) out += ch;
  }
  return out;
};

export const isValidNic = (value: string): boolean => NIC_PATTERN.test(value.trim().toUpperCase());

// The NIC day count treats every year as having Feb 29.
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Date of birth (yyyy-mm-dd) and gender encoded in a valid NIC number, or null if it doesn't decode. */
export const decodeNic = (value: string): { dateOfBirth: string; gender: 'Male' | 'Female' } | null => {
  const nic = value.trim().toUpperCase();
  if (!NIC_PATTERN.test(nic)) return null;

  const year = nic.length === 12 ? Number(nic.slice(0, 4)) : 1900 + Number(nic.slice(0, 2));
  let day = Number(nic.length === 12 ? nic.slice(4, 7) : nic.slice(2, 5));
  const gender = day > 500 ? 'Female' : 'Male';
  if (day > 500) day -= 500;
  if (day < 1 || day > 366 || year > new Date().getFullYear()) return null;

  let month = 0;
  while (month < 12 && day > MONTH_DAYS[month]) day -= MONTH_DAYS[month++];
  if (month === 12) return null;
  if (month === 1 && day === 29 && !isLeapYear(year)) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return { dateOfBirth: `${year}-${pad(month + 1)}-${pad(day)}`, gender };
};
