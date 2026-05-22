"use client";

import { useEffect } from "react";
import { useAdvisorChat } from "@/features/chat/hooks/useAdvisorChat";

const STORAGE_KEY = "dan-auto-chat-session";
const LEGACY_STORAGE_KEY = "dana-auto-chat-session";

/** Floating service advisor — persists session + transcript in sessionStorage */
export function useChatSession() {
  useEffect(() => {
    const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, legacy);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  return useAdvisorChat({
    sessionStorageKey: STORAGE_KEY,
    enabled: true,
  });
}
