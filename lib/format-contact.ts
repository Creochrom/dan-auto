/** Digits only — for validation and API payloads. */
export function stripPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/** UK E.164 digits without plus (e.g. 447850964041). */
export function toUkE164Digits(phone: string): string {
  let digits = stripPhone(phone);
  if (!digits) return "";
  if (digits.startsWith("44")) return digits.slice(0, 12);
  if (digits.startsWith("0")) return `44${digits.slice(1, 11)}`;
  if (digits.length === 10) return `44${digits}`;
  return digits;
}

/** Readable UK display for workshop UI (e.g. +44 7850 964041). */
export function formatPhoneDisplay(phone: string): string {
  const e164 = toUkE164Digits(phone);
  if (!e164) return "";

  if (e164.startsWith("44") && e164.length >= 11) {
    const national = e164.slice(2);
    if (national.length === 10) {
      return `+44 ${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
    }
    if (national.length <= 4) return `+44 ${national}`;
    return `+44 ${national.slice(0, 4)} ${national.slice(4)}`;
  }

  return formatPhoneInput(phone);
}

/** tel: link for dialling (e.g. tel:+447850964041). */
export function phoneTelHref(phone: string): string {
  const e164 = toUkE164Digits(phone);
  return e164 ? `tel:+${e164}` : "tel:";
}

/**
 * Light UK-friendly spacing while typing (07XXX XXX XXX or +44 7XXX XXX XXX).
 * Not a strict mask — allows partial input and pastes.
 */
export function formatPhoneInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const digits = stripPhone(value);
  if (!digits) return trimmed.startsWith("+") ? "+" : "";

  const useIntl =
    trimmed.startsWith("+") || digits.startsWith("44") || digits.startsWith("0044");

  if (useIntl) {
    let national = digits;
    if (national.startsWith("0044")) national = national.slice(4);
    else if (national.startsWith("44")) national = national.slice(2);
    national = national.slice(0, 10);

    if (!national) return "+44 ";
    if (national.length <= 4) return `+44 ${national}`;
    if (national.length <= 7) return `+44 ${national.slice(0, 4)} ${national.slice(4)}`;
    return `+44 ${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
  }

  const local = digits.startsWith("0") ? digits.slice(0, 11) : digits.slice(0, 11);
  if (local.length <= 5) return local;
  if (local.length <= 8) return `${local.slice(0, 5)} ${local.slice(5)}`;
  return `${local.slice(0, 5)} ${local.slice(5, 8)} ${local.slice(8)}`;
}

/** Trim and lowercase — applied on blur. */
export function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}
