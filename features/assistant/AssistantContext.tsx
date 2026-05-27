"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { BookingChatContext } from "@/lib/types/chat";
import type { HeroConciergeMode } from "@/lib/types/hero-concierge";
import { mergeBookingPrefill } from "@/lib/booking-prefill";
import { formatPlate } from "@/lib/format-plate";

export type OpenAssistantOptions = {
  registration?: string;
  bookingContext?: BookingChatContext;
  advisorRoute?: AdvisorRouteContext;
  /** Opens the Hero concierge in this mode (after plate scan). */
  conciergeMode?: HeroConciergeMode;
};

function inferConciergeMode(
  route?: AdvisorRouteContext,
  explicit?: HeroConciergeMode
): HeroConciergeMode | undefined {
  if (explicit) return explicit;
  if (!route) return undefined;
  if (route.concierge_mode && route.concierge_mode !== "hub") {
    return route.concierge_mode;
  }
  if (route.surface === "mot_help" || route.intent === "booking") return "booking";
  if (
    route.surface === "warning_light_help" ||
    route.intent === "diagnostic_help"
  ) {
    return "diagnostic";
  }
  return undefined;
}

type AssistantContextValue = {
  /** @deprecated Floating widget removed — use heroLaunchId to open Hero chat. */
  open: boolean;
  setOpen: (open: boolean) => void;
  openAssistant: (options?: OpenAssistantOptions) => void;
  closeAssistant: () => void;
  registrationHint?: string;
  bookingContext?: BookingChatContext;
  advisorRoute?: AdvisorRouteContext;
  heroLaunchId: number;
  heroConciergeMode?: HeroConciergeMode;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [registrationHint, setRegistrationHint] = useState<string | undefined>();
  const [bookingContext, setBookingContext] = useState<BookingChatContext | undefined>();
  const [advisorRoute, setAdvisorRoute] = useState<AdvisorRouteContext | undefined>();
  const [heroLaunchId, setHeroLaunchId] = useState(0);
  const [heroConciergeMode, setHeroConciergeMode] = useState<
    HeroConciergeMode | undefined
  >();

  const openAssistant = useCallback((options?: OpenAssistantOptions) => {
    const route = options?.advisorRoute
      ? {
          handoff_policy: "explicit_only" as const,
          ...options.advisorRoute,
        }
      : undefined;

    setRegistrationHint(options?.registration);
    setBookingContext(options?.bookingContext);

    if (options?.bookingContext) {
      mergeBookingPrefill({
        service: options.bookingContext.service,
        preferredDate: options.bookingContext.preferredDate,
        preferredTime: options.bookingContext.preferredTime,
      });
    }
    if (options?.registration) {
      mergeBookingPrefill({
        registration: formatPlate(options.registration),
      });
    }
    setAdvisorRoute(route);
    setHeroConciergeMode(
      inferConciergeMode(route, options?.conciergeMode)
    );
    setHeroLaunchId((g) => g + 1);

    if (typeof document !== "undefined") {
      document.getElementById("hero-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const closeAssistant = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openAssistant,
      closeAssistant,
      registrationHint,
      bookingContext,
      advisorRoute,
      heroLaunchId,
      heroConciergeMode,
    }),
    [
      open,
      openAssistant,
      closeAssistant,
      registrationHint,
      bookingContext,
      advisorRoute,
      heroLaunchId,
      heroConciergeMode,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

export function useAssistantOptional() {
  return useContext(AssistantContext);
}
