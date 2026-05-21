/**
 * Plate input character rules — separate from full UK registration format validation.
 * Format checks (length, pattern) belong on submit / debounced blur only.
 */

/** Characters the user may type (formatter may insert spaces) */
export const PLATE_ALLOWED_CHAR_RE = /[a-zA-Z0-9 ]/;

export function isAllowedPlateChar(char: string): boolean {
  return char.length === 1 && PLATE_ALLOWED_CHAR_RE.test(char);
}

/** Characters that trigger rejection feedback (wrong script / symbols) */
export function isInvalidPlateChar(char: string): boolean {
  if (char.length !== 1) return false;
  return !PLATE_ALLOWED_CHAR_RE.test(char);
}

export function findInvalidPlateChars(raw: string): string[] {
  const bad: string[] = [];
  for (const ch of raw) {
    if (isInvalidPlateChar(ch)) bad.push(ch);
  }
  return bad;
}

export function hasInvalidPlateChars(raw: string): boolean {
  return findInvalidPlateChars(raw).length > 0;
}
