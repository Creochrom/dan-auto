"use client";

import { AssistantProvider } from "@/features/assistant/AssistantContext";
import { AIChatWidget } from "@/features/assistant/components/AIChatWidget";
import { I18nProvider } from "./I18nProvider";
import { GoogleTranslateMount } from "./GoogleTranslateMount";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AssistantProvider>
        {children}
        <AIChatWidget />
      </AssistantProvider>
      <GoogleTranslateMount />
    </I18nProvider>
  );
}
