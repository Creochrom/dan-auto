export const COOKIE_CONSENT_STORAGE_KEY = "dan_auto_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;

export type CookieConsentLevel = "all" | "essential_only" | "custom";

export type CookiePreferences = {
  version: typeof COOKIE_CONSENT_VERSION;
  level: CookieConsentLevel;
  essential: true;
  analytics: boolean;
  functional: boolean;
  decidedAt: string;
};

export function defaultPreferences(level: CookieConsentLevel): CookiePreferences {
  const analytics = level === "all";
  const functional = level === "all";
  return {
    version: COOKIE_CONSENT_VERSION,
    level,
    essential: true,
    analytics,
    functional,
    decidedAt: new Date().toISOString(),
  };
}

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (!parsed.decidedAt || parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookiePreferences(prefs: CookiePreferences): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(prefs));
}

export function hasCookieConsentDecision(): boolean {
  return readCookiePreferences() !== null;
}

export function analyticsCookiesAllowed(): boolean {
  return readCookiePreferences()?.analytics === true;
}
