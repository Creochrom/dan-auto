/** Strip control chars and trim — safe for email/log fields */
export function sanitizePlainText(
  value: string | undefined | null,
  maxLen = 4000
): string {
  if (!value) return "";
  return value
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\<>:"|?*]/g, "_").replace(/\.\./g, "_");
  return base.slice(0, 180) || "upload";
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
