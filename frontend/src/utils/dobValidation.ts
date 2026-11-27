/* src/utils/dobValidation.ts */
// Shared rules for "Date of Birth" fields: applicant must be at least 18
// and at most 65 years old (i.e. not yet 66) on today's date.

export const MIN_AGE = 18;
export const MAX_AGE = 65;

const pad = (n: number) => String(n).padStart(2, '0');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Whole years between the given yyyy-mm-dd date and today. */
export const calculateAge = (dob: string): number => {
  const [y, m, d] = dob.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
};

/** Latest allowed birth date (turns 18 today). Use as the input's `max`. */
export const getMaxDob = (): string => {
  const t = new Date();
  return toIsoDate(new Date(t.getFullYear() - MIN_AGE, t.getMonth(), t.getDate()));
};

/** Earliest allowed birth date (turns 66 tomorrow). Use as the input's `min`. */
export const getMinDob = (): string => {
  const t = new Date();
  return toIsoDate(new Date(t.getFullYear() - (MAX_AGE + 1), t.getMonth(), t.getDate() + 1));
};

export const isValidDob = (dob: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const age = calculateAge(dob);
  return age >= MIN_AGE && age <= MAX_AGE;
};

export const DOB_ERROR = `Age must be between ${MIN_AGE} and ${MAX_AGE} years.`;
