/** Accepts common formats; requires 7–15 digits (E.164-style upper bound). */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
