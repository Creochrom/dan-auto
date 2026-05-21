import type { Locale } from "./index";

/** English names for device-language prompts */
export const LOCALE_EN_NAME: Record<Exclude<Locale, "en">, string> = {
  ru: "Russian",
  pl: "Polish",
  ro: "Romanian",
  uk: "Ukrainian",
};

/** Native endonym for polite language prompts */
export const LOCALE_NATIVE_NAME: Record<Exclude<Locale, "en">, string> = {
  ru: "Русский",
  pl: "Polski",
  ro: "Română",
  uk: "Українська",
};
