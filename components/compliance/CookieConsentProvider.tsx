"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { PrivacyPolicyModal } from "@/components/compliance/PrivacyPolicyModal";
import {
  defaultPreferences,
  hasCookieConsentDecision,
  readCookiePreferences,
  writeCookiePreferences,
  type CookieConsentLevel,
  type CookiePreferences,
} from "@/lib/cookies/consent";

type CookieConsentContextValue = {
  preferences: CookiePreferences | null;
  openSettings: () => void;
  openPrivacyPolicy: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}

/** Safe for optional UI (e.g. footer) — no-op when provider is absent. */
export function useCookieConsentOptional(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  return (
    ctx ?? {
      preferences: null,
      openSettings: () => {},
      openPrivacyPolicy: () => {},
    }
  );
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(true);
  const [draftFunctional, setDraftFunctional] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    const saved = readCookiePreferences();
    setPreferences(saved);
    setVisible(!hasCookieConsentDecision());
    setHydrated(true);
  }, []);

  const persist = useCallback((prefs: CookiePreferences) => {
    writeCookiePreferences(prefs);
    setPreferences(prefs);
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist(defaultPreferences("all"));
  }, [persist]);

  const rejectNonEssential = useCallback(() => {
    persist(defaultPreferences("essential_only"));
  }, [persist]);

  const openSettings = useCallback(() => {
    const current = readCookiePreferences();
    setDraftAnalytics(current?.analytics ?? false);
    setDraftFunctional(current?.functional ?? false);
    setSettingsOpen(true);
    setVisible(true);
  }, []);

  const openPrivacyPolicy = useCallback(() => setPrivacyOpen(true), []);
  const closePrivacyPolicy = useCallback(() => setPrivacyOpen(false), []);

  const saveCustom = useCallback(() => {
    const level: CookieConsentLevel = "custom";
    persist({
      version: 1,
      level,
      essential: true,
      analytics: draftAnalytics,
      functional: draftFunctional,
      decidedAt: new Date().toISOString(),
    });
  }, [draftAnalytics, draftFunctional, persist]);

  const dismissSettings = useCallback(() => {
    if (preferences) {
      setSettingsOpen(false);
      setVisible(false);
      return;
    }
    setSettingsOpen(false);
  }, [preferences]);

  const value = useMemo(
    () => ({ preferences, openSettings, openPrivacyPolicy }),
    [preferences, openSettings, openPrivacyPolicy]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {hydrated && visible && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[70] p-4 sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:p-0"
            role="dialog"
            aria-label="Cookie consent"
            aria-modal="true"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#d4a63c]/20 bg-black/95 px-5 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_0%,rgba(212,166,60,0.08),transparent)]"
                aria-hidden
              />

              {!settingsOpen ? (
                <>
                  <p className="relative text-[13px] leading-relaxed text-zinc-300">
                    We use cookies to improve website functionality, analytics and customer
                    experience.
                  </p>
                  <div className="relative mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="min-h-11 rounded-full bg-[#d4a63c] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-[#e8c96a]"
                    >
                      Accept all
                    </button>
                    <button
                      type="button"
                      onClick={rejectNonEssential}
                      className="min-h-11 rounded-full border border-white/12 px-5 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-[#d4a63c]/35 hover:text-white"
                    >
                      Reject non-essential
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftAnalytics(preferences?.analytics ?? false);
                        setDraftFunctional(preferences?.functional ?? false);
                        setSettingsOpen(true);
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-[#d4a63c]/35 hover:text-white"
                    >
                      <Settings2 className="h-3.5 w-3.5" aria-hidden />
                      Cookie settings
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="relative text-sm font-medium text-white">Cookie settings</p>
                  <p className="relative mt-1 text-xs leading-relaxed text-zinc-400">
                    Essential cookies are required for the site to work. You can choose optional
                    categories below.                     See our{" "}
                    <button
                      type="button"
                      onClick={openPrivacyPolicy}
                      className="text-[#d4a63c] underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </button>{" "}
                    for details.
                  </p>
                  <ul className="relative mt-4 space-y-3 text-xs">
                    <li className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                      <div>
                        <p className="font-medium text-zinc-200">Essential</p>
                        <p className="mt-0.5 text-zinc-500">Required for bookings and site security.</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#d4a63c]/90">
                        Always on
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                      <div>
                        <p className="font-medium text-zinc-200">Analytics</p>
                        <p className="mt-0.5 text-zinc-500">Helps us understand how the site is used.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftAnalytics}
                        onChange={(e) => setDraftAnalytics(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 accent-[#d4a63c]"
                        aria-label="Allow analytics cookies"
                      />
                    </li>
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                      <div>
                        <p className="font-medium text-zinc-200">Functionality</p>
                        <p className="mt-0.5 text-zinc-500">Remembers preferences such as saved details.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={draftFunctional}
                        onChange={(e) => setDraftFunctional(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 accent-[#d4a63c]"
                        aria-label="Allow functionality cookies"
                      />
                    </li>
                  </ul>
                  <div className="relative mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveCustom}
                      className="min-h-10 rounded-full bg-[#d4a63c] px-5 py-2 text-xs font-semibold text-black transition hover:bg-[#e8c96a]"
                    >
                      Save preferences
                    </button>
                    <button
                      type="button"
                      onClick={dismissSettings}
                      className="min-h-10 rounded-full border border-white/12 px-5 py-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
                    >
                      {preferences ? "Close" : "Back"}
                    </button>
                  </div>
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PrivacyPolicyModal open={privacyOpen} onClose={closePrivacyPolicy} />
    </CookieConsentContext.Provider>
  );
}
