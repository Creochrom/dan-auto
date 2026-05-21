"use client";

import { I18nProvider } from "./I18nProvider";
import { GoogleTranslateMount } from "./GoogleTranslateMount";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <GoogleTranslateMount />
    </I18nProvider>
  );
}
