import { en, type Messages } from "./locales/en";
import { ru } from "./locales/ru";
import { pl } from "./locales/pl";
import { ro } from "./locales/ro";
import { uk } from "./locales/uk";

export type { Messages } from "./locales/en";
export type Locale = "en" | "ru" | "pl" | "ro" | "uk";

export const LOCALES: Locale[] = ["en", "ru", "pl", "ro", "uk"];

export const messages: Record<Locale, Messages> = { en, ru, pl, ro, uk };

export const LOCALE_COOKIE = "dan_locale";

const BROWSER_MAP: Record<string, Locale> = {
  ru: "ru",
  pl: "pl",
  ro: "ro",
  uk: "uk",
  ua: "uk",
};

export function detectBrowserLocale(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const lang = navigator.language?.toLowerCase() ?? "";
  const code = lang.split("-")[0];
  if (code === "en") return null;
  return BROWSER_MAP[code] ?? null;
}

export function t(locale: Locale): Messages {
  return messages[locale] ?? en;
}
