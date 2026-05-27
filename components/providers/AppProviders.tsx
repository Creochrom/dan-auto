"use client";

import { AssistantProvider } from "@/features/assistant/AssistantContext";
import { I18nProvider } from "./I18nProvider";
import { GoogleTranslateMount } from "./GoogleTranslateMount";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AssistantProvider>{children}</AssistantProvider>
      <GoogleTranslateMount />
    </I18nProvider>
  );
}
