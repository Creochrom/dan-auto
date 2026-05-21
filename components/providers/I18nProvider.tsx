"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  detectBrowserLocale,
  LOCALE_COOKIE,
  t,
  type Locale,
  type Messages,
} from "@/lib/i18n";
import { LOCALE_NATIVE_NAME } from "@/lib/i18n/language-names";
import { setMachineTranslateFlag } from "@/lib/google-translate";

const BANNER_DISMISS_KEY = "dan_auto_translate_banner_dismissed";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  /** True when site UI is not English (user chose translation) — nav shows Return to English only */
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

function bannerDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(BANNER_DISMISS_KEY) === "1";
}

function setBannerDismissed() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(BANNER_DISMISS_KEY, "1");
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [suggested, setSuggested] = useState<Locale | null>(null);

  useEffect(() => {
    const saved = readCookieLocale();
    if (saved) {
      setLocaleState(saved);
    } else if (!bannerDismissed()) {
      const detected = detectBrowserLocale();
      if (detected) {
        setSuggested(detected);
        setShowBanner(true);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale === "en" ? "en-GB" : locale;
  }, [locale, hydrated]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    setShowBanner(false);
  }, []);

  const acceptTranslation = useCallback(() => {
    if (!suggested) return;
    setLocale(suggested);
    setMachineTranslateFlag(true);
    setShowBanner(false);
    window.location.reload();
  }, [suggested, setLocale]);

  const declineTranslation = useCallback(() => {
    setBannerDismissed();
    setShowBanner(false);
  }, []);

  const returnToEnglish = useCallback(() => {
    setLocaleState("en");
    document.cookie = `${LOCALE_COOKIE}=en;path=/;max-age=31536000;SameSite=Lax`;
    setMachineTranslateFlag(false);
    window.location.reload();
  }, []);

  const isLocalizedExperience = locale !== "en";

  const value = useMemo(
    () => ({
      locale,
      messages: t(locale),
      setLocale,
      isLocalizedExperience,
      returnToEnglish,
    }),
    [locale, setLocale, isLocalizedExperience, returnToEnglish]
  );

  const en = t("en");
  const langLabel =
    suggested && suggested !== "en" ? LOCALE_NATIVE_NAME[suggested] : "";

  return (
    <I18nContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {hydrated && showBanner && suggested && suggested !== "en" && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-4 right-4 z-[60] mx-auto max-w-lg sm:left-auto sm:right-8 sm:mx-0"
            role="dialog"
            aria-label="Translation suggestion"
          >
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-zinc-950/95 px-5 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_0%,rgba(201,162,39,0.08),transparent)]"
                aria-hidden
              />
              <p className="relative text-[13px] leading-relaxed text-zinc-300">
                <span className="text-zinc-500">{en.translateBannerLead}</span>{" "}
                <span className="font-medium text-white">{langLabel}</span>.{" "}
                {en.translateBannerQuestion}
              </p>
              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={acceptTranslation}
                  className="min-h-11 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 px-5 py-2.5 text-xs font-semibold tracking-wide text-black shadow-[0_0_24px_rgba(201,162,39,0.25)]"
                >
                  {en.translateBannerAccept}
                </button>
                <button
                  type="button"
                  onClick={declineTranslation}
                  className="min-h-11 rounded-full border border-white/12 px-5 py-2.5 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                >
                  {en.translateBannerDecline}
                </button>
              </div>
              <button
                type="button"
                onClick={declineTranslation}
                className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
