"use client";

import { useEffect, useRef } from "react";
import { useAdvisorChat } from "@/features/chat/hooks/useAdvisorChat";
import { useMediaUpload } from "@/features/booking/hooks/useMediaUpload";
import { useAssistant } from "@/features/assistant/AssistantContext";

const STORAGE_KEY = "dan-auto-chat-session";
const LEGACY_STORAGE_KEY = "dana-auto-chat-session";

/** Floating service advisor — persists session + transcript in sessionStorage */
export function useChatSession() {
  const {
    open,
    bookingContext,
    advisorRoute,
    registrationHint,
    heroLaunchId,
  } = useAssistant();

  const media = useMediaUpload();

  const chat = useAdvisorChat({
    sessionStorageKey: STORAGE_KEY,
    enabled: open,
    bookingContext,
    advisorRoute:
      advisorRoute ??
      (open
        ? {
            entry_point: "floating_widget",
            intent: "general",
            surface: "floating_widget",
          }
        : null),
    registrationHint,
    uploadIds: media.uploadIds,
    introMode: "workshop",
  });

  const lastLaunch = useRef(0);
  const { reset, bootstrap } = chat;

  useEffect(() => {
    const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, legacy);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (heroLaunchId === lastLaunch.current) return;
    lastLaunch.current = heroLaunchId;
    reset();
  }, [heroLaunchId, reset]);

  useEffect(() => {
    if (open) void bootstrap();
  }, [open, bootstrap]);

  return { ...chat, media };
}
