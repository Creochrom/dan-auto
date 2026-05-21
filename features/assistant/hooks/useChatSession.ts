"use client";

import { useAdvisorChat } from "@/features/chat/hooks/useAdvisorChat";

const STORAGE_KEY = "dana-auto-chat-session";

/** Floating service advisor — persists session + transcript in sessionStorage */
export function useChatSession() {
  return useAdvisorChat({
    sessionStorageKey: STORAGE_KEY,
    enabled: true,
  });
}
