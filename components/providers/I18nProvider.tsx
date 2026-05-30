"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LOCALE_COOKIE, t, type Locale, type Messages } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  /** True when site UI is not English — nav shows Return to English */
  isLocalizedExperience: boolean;
  returnToEnglish: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const val = match?.[1];
  if (val === "ru" || val === "pl" || val === "ro" || val === "uk" || val === "en") {
    return val;
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readCookieLocale();
    if (saved) setLocaleState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale === "en" ? "en-GB" : locale;
  }, [locale, hydrated]);

  const returnToEnglish = useCallback(() => {
    setLocaleState("en");
    document.cookie = `${LOCALE_COOKIE}=en;path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }, []);

  const isLocalizedExperience = locale !== "en";

  const value = useMemo(
    () => ({
      locale,
      messages: t(locale),
      isLocalizedExperience,
      returnToEnglish,
    }),
    [locale, isLocalizedExperience, returnToEnglish]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
