export type UkPhoneParseResult =
  | { valid: true; e164: string; national: string; display: string }
  | { valid: false; reason: string };

/** Returns true if the string looks like the user is trying to send a phone number. */
export function looksLikePhoneInput(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  if (digitCount < 9) return false;
  return /^[\d\s+().-]+$/.test(trimmed) || /^(?:\+?44|0)7/.test(trimmed.replace(/\s/g, ""));
}

/**
 * Parse and validate UK mobile/landline numbers (common customer formats).
 * Accepts 07…, +447…, 447…, and spaced variants.
 */
export function parseUkPhone(input: string): UkPhoneParseResult {
  const raw = input.trim();
  if (!raw) return { valid: false, reason: "empty" };

  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("44")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // UK mobiles: 7XXXXXXXXX (10 digits after stripping leading 0/44)
  if (digits.length === 10 && digits.startsWith("7")) {
    const national = `0${digits}`;
    return {
      valid: true,
      e164: `+44${digits}`,
      national,
      display: formatUkMobileDisplay(national),
    };
  }

  // 11 digits with leading 0 stripped incorrectly — e.g. 07123456789 → 7123456789
  if (digits.length === 11 && digits.startsWith("07")) {
    digits = digits.slice(1);
    if (digits.startsWith("7") && digits.length === 10) {
      const national = `0${digits}`;
      return {
        valid: true,
        e164: `+44${digits}`,
        national,
        display: formatUkMobileDisplay(national),
      };
    }
  }

  // Landline 10–11 digits (area codes) — allow workshop callback
  if (digits.length >= 10 && digits.length <= 11 && /^[1-9]/.test(digits)) {
    const national = digits.length === 10 ? `0${digits}` : `0${digits.slice(0, 10)}`;
    return {
      valid: true,
      e164: `+44${digits.replace(/^0/, "")}`,
      national: raw.startsWith("0") ? raw.replace(/\s/g, "") : `0${digits}`,
      display: raw,
    };
  }

  return {
    valid: false,
    reason: "format",
  };
}

function formatUkMobileDisplay(national: string): string {
  const d = national.replace(/\D/g, "");
  if (d.length !== 11) return national;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export const UK_PHONE_INVALID_HINT =
  "That doesn't look quite right for a UK number — please double-check (e.g. 07XXX XXX XXX).";

export const UK_PHONE_CONFIRMED_PREFIX = "My callback number is";
