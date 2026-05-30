"use client";

import { AssistantProvider } from "@/features/assistant/AssistantContext";
import { CookieConsentProvider } from "@/components/compliance/CookieConsentProvider";
import { I18nProvider } from "./I18nProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CookieConsentProvider>
        <AssistantProvider>{children}</AssistantProvider>
      </CookieConsentProvider>
    </I18nProvider>
  );
}
