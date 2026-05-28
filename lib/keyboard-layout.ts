/**
 * Keyboard / script layout hints for Southampton multicultural UX.
 * Believable feedback — not perfect OS-level detection.
 */

export type KeyboardLayoutHint =
  | "en"
  | "pl"
  | "zh"
  | "in"
  | "ro"
  | "pt"
  | "ua"
  | "ru"
  | "other";

export const KEYBOARD_LAYOUT_LABELS: Record<KeyboardLayoutHint, string> = {
  en: "English keyboard",
  pl: "Polish keyboard",
  zh: "Chinese keyboard",
  in: "Hindi / Indian keyboard",
  ro: "Romanian keyboard",
  pt: "Portuguese keyboard",
  ua: "Ukrainian keyboard",
  ru: "Russian keyboard",
  other: "Other keyboard layout",
};

const POLISH_RE = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const ROMANIAN_RE = /[ăâîșțĂÂÎȘȚşţ]/;
const PORTUGUESE_RE = /[ãõçÃÕÇáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙ]/;
const UKRAINIAN_RE = /[іїєґІЇЄҐ]/;
const CYRILLIC_RE = /[\u0400-\u04FF]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const CJK_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

function normaliseLangTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/_/g, "-");
}

function inferFromLanguageCode(rawCode: string): KeyboardLayoutHint {
  const code = normaliseLangTag(rawCode).split("-")[0] ?? "en";
  if (code === "pl") return "pl";
  if (code === "zh" || code === "yue" || code === "cmn") return "zh";
  if (code === "hi" || code === "bn" || code === "pa" || code === "gu" || code === "mr") {
    return "in";
  }
  if (code === "ro") return "ro";
  if (code === "pt") return "pt";
  if (code === "uk" || code === "ua") return "ua";
  if (code === "ru") return "ru";
  return "en";
}

/** Initial hint from browser locale list.
 *
 * NOTE: Node 22+ defines a global `navigator` reflecting the host OS
 * locale, so `typeof navigator === "undefined"` is no longer a reliable
 * server check. Gate on `window` instead to ensure this only runs in a
 * real browser; otherwise SSR can disagree with the client and corrupt
 * React hydration (which freezes framer-motion `whileInView` sections
 * at opacity:0).
 */
export function inferLayoutFromLanguages(): KeyboardLayoutHint {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "en";
  }

  const langs = [...(navigator.languages ?? []), navigator.language].filter(Boolean);

  for (const raw of langs) {
    const hint = inferFromLanguageCode(raw);
    if (hint !== "en") return hint;
  }

  return "en";
}

export function keyboardLayoutFromLocaleCookie(): KeyboardLayoutHint | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)dan_locale=([^;]+)/);
  const raw = match?.[1]?.trim().toLowerCase();
  if (!raw) return null;
  return inferFromLanguageCode(raw);
}

/** Infer layout from a typed character (typically invalid / wrong-script input) */
export function hintFromTypedChar(char: string): KeyboardLayoutHint | null {
  if (char.length !== 1) return null;

  if (/[a-zA-Z0-9 ]/.test(char)) return "en";

  if (DEVANAGARI_RE.test(char)) return "in";
  if (CJK_RE.test(char)) return "zh";
  if (UKRAINIAN_RE.test(char)) return "ua";
  if (CYRILLIC_RE.test(char)) return "ru";
  if (POLISH_RE.test(char)) return "pl";
  if (ROMANIAN_RE.test(char)) return "ro";
  if (PORTUGUESE_RE.test(char)) return "pt";

  return "other";
}

function hintFromLayoutMapSample(sample: string): KeyboardLayoutHint | null {
  if (!sample) return null;

  if (DEVANAGARI_RE.test(sample)) return "in";
  if (CJK_RE.test(sample)) return "zh";
  if (UKRAINIAN_RE.test(sample)) return "ua";
  if (CYRILLIC_RE.test(sample)) return "ru";
  if (POLISH_RE.test(sample)) return "pl";
  if (ROMANIAN_RE.test(sample)) return "ro";
  if (PORTUGUESE_RE.test(sample)) return "pt";
  if (/^[a-zA-Z]$/.test(sample)) return "en";

  return "other";
}

/** Experimental Keyboard API layout map (Chrome / Edge) */
export async function inferLayoutFromKeyboardApi(): Promise<KeyboardLayoutHint | null> {
  try {
    const nav = navigator as Navigator & {
      keyboard?: { getLayoutMap: () => Promise<Map<string, string>> };
    };
    if (!nav.keyboard?.getLayoutMap) return null;

    const map = await nav.keyboard.getLayoutMap();
    const keys = ["KeyQ", "KeyW", "KeyA", "BracketLeft", "Semicolon"] as const;
    const samples = keys.map((k) => map.get(k) ?? "").filter(Boolean);

    for (const sample of samples) {
      const hint = hintFromLayoutMapSample(sample);
      if (hint && hint !== "en") return hint;
    }

    const first = samples[0];
    if (first) return hintFromLayoutMapSample(first) ?? "en";

    return null;
  } catch {
    return null;
  }
}
