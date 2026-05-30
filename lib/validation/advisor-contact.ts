import { parseUkPhone } from "@/lib/validation/uk-phone";

const PLACEHOLDER_NAME =
  /^(?:my\s+name(?:\s+and\s+(?:number|phone|mobile))?|name\s+and\s+(?:number|phone|mobile)|call\s+me|customer|user|n\/a|na|none|tbc|unknown|you\s+already\s+have\s+my(?:\s+details|\s+number|\s+phone|\s+contact)?|use\s+the\s+same\s+(?:number|phone|mobile)|same\s+(?:number|phone|mobile)\s+as\s+before|\[(?:your\s+)?(?:name|mobile\s*number|phone|number|contact)\]|\[(?:name|mobile number|your number|your name)\])$/i;

const PLACEHOLDER_PHONE =
  /^(?:my\s+(?:name\s+and\s+)?(?:number|phone|mobile)|call\s+me|whatsapp(?:\s+is\s+best|\s+me)?|text\s+me|email\s+me|n\/a|na|none|tbc|unknown|you\s+already\s+have\s+my(?:\s+details|\s+number|\s+phone|\s+contact)?|use\s+the\s+same\s+(?:number|phone|mobile)|same\s+(?:number|phone|mobile)\s+as\s+before|\[(?:your\s+)?(?:name|mobile\s*number|phone|number|contact)\]|\[(?:name|mobile number|your number|your name)\])$/i;

const GENERIC_NAME =
  /^(?:mr|mrs|ms|dr|miss)\.?$/i;

/** Reject vague contact phrases the model sometimes stores as real data. */
export function isPlaceholderName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2) return true;
  if (PLACEHOLDER_NAME.test(trimmed)) return true;
  if (GENERIC_NAME.test(trimmed)) return true;
  if (/name\s+and\s+(number|phone|mobile)/i.test(trimmed)) return true;
  if (/^(?:phone|mobile|number|contact)$/i.test(trimmed)) return true;
  if (/you\s+already\s+have\s+my/i.test(trimmed)) return true;
  if (/use\s+the\s+same\s+(?:number|phone|mobile)/i.test(trimmed)) return true;
  if (/same\s+(?:number|phone|mobile)\s+as\s+before/i.test(trimmed)) return true;
  return false;
}

export function isPlaceholderPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (PLACEHOLDER_PHONE.test(trimmed)) return true;
  if (/whatsapp/i.test(trimmed) && !/\d{7,}/.test(trimmed)) return true;
  if (/you\s+already\s+have\s+my/i.test(trimmed)) return true;
  if (/use\s+the\s+same\s+(?:number|phone|mobile)/i.test(trimmed)) return true;
  if (/same\s+(?:number|phone|mobile)\s+as\s+before/i.test(trimmed)) return true;
  return false;
}

/** True when free-text looks like a vague contact phrase rather than real details. */
export function isPlaceholderContactInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (isPlaceholderName(trimmed) || isPlaceholderPhone(trimmed)) return true;
  if (/name\s+and\s+(number|phone|mobile)/i.test(trimmed)) return true;
  if (/^\[(?:your\s+)?(?:name|mobile|phone|number)/i.test(trimmed)) return true;
  if (/you\s+already\s+have\s+my/i.test(trimmed)) return true;
  if (/use\s+the\s+same\s+(?:number|phone|mobile)/i.test(trimmed)) return true;
  if (/same\s+(?:number|phone|mobile)\s+as\s+before/i.test(trimmed)) return true;
  if (/^(?:call|whatsapp|text|email)\s+me\.?$/i.test(trimmed)) return true;
  return false;
}

export function validateCustomerName(
  value: string | undefined | null
): { valid: true; normalized: string } | { valid: false } {
  const trimmed = (value ?? "").trim();
  if (isPlaceholderName(trimmed)) return { valid: false };
  if (trimmed.length < 2 || trimmed.length > 80) return { valid: false };
  if (!/[a-zA-Z]/.test(trimmed)) return { valid: false };
  return { valid: true, normalized: trimmed };
}

export function validateCustomerPhone(
  value: string | undefined | null
): { valid: true; normalized: string; display: string } | { valid: false } {
  const trimmed = (value ?? "").trim();
  if (isPlaceholderPhone(trimmed)) return { valid: false };
  const parsed = parseUkPhone(trimmed);
  if (!parsed.valid) return { valid: false };
  return {
    valid: true,
    normalized: parsed.national,
    display: parsed.display,
  };
}

export type LeadContactValidation = {
  customerName: boolean;
  phone: boolean;
  canSubmit: boolean;
};

export function validateLeadContact(
  name?: string | null,
  phone?: string | null
): LeadContactValidation {
  const customerName = validateCustomerName(name).valid;
  const phoneValid = validateCustomerPhone(phone).valid;
  return {
    customerName,
    phone: phoneValid,
    canSubmit: customerName && phoneValid,
  };
}
