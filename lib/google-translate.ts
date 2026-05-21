/**
 * Google Translate (optional machine layer after user accepts).
 * Loads translate_a/element.js and instantiates TranslateElement in a hidden host.
 */
export const MACHINE_TRANSLATE_KEY = "dan_auto_machine_translate";

export function readMachineTranslateFlag(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(MACHINE_TRANSLATE_KEY) === "1";
}

export function setMachineTranslateFlag(enabled: boolean) {
  if (typeof sessionStorage === "undefined") return;
  if (enabled) sessionStorage.setItem(MACHINE_TRANSLATE_KEY, "1");
  else sessionStorage.removeItem(MACHINE_TRANSLATE_KEY);
}

const HOST_ID = "dan-google-translate-host";

export function mountGoogleTranslateWidget(): void {
  if (typeof document === "undefined" || !readMachineTranslateFlag()) return;
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.className = "fixed bottom-0 right-0 z-[45] opacity-0 pointer-events-none h-0 w-0 overflow-hidden";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  const script = document.createElement("script");
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=danAutoTranslateElementInit";
  script.async = true;

  (window as unknown as { danAutoTranslateElementInit?: () => void }).danAutoTranslateElementInit =
    () => {
      const g = window as unknown as {
        google?: {
          translate?: {
            TranslateElement: new (
              opts: Record<string, unknown>,
              id: string
            ) => void;
          };
        };
      };
      const T = g.google?.translate?.TranslateElement;
      if (!T) return;
      try {
        new T(
          {
            pageLanguage: "en",
            includedLanguages: "ru,pl,ro,uk",
            layout: 0,
            autoDisplay: false,
          },
          HOST_ID
        );
      } catch {
        /* non-blocking */
      }
    };

  document.head.appendChild(script);
}
