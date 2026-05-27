"use client";

import { useEffect, useRef } from "react";

const ENDPOINT =
  "http://127.0.0.1:7419/ingest/0fdd9834-de10-4ffc-bd0f-18c861dff413";

function log(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c7fd8d",
    },
    body: JSON.stringify({
      sessionId: "c7fd8d",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

type Props = {
  marker: string;
};

/** Debug-only render probe — remove after empty-sections issue is verified fixed. */
export function HomeRenderProbe({ marker }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const services = document.getElementById("services");
    log("C", "HomeRenderProbe.tsx:mount", `probe mounted: ${marker}`, {
      marker,
      port: window.location.port,
      href: window.location.href,
      servicesExists: Boolean(services),
      servicesOpacity: services
        ? getComputedStyle(services).opacity
        : null,
      servicesRectTop: services?.getBoundingClientRect().top ?? null,
      probeRectTop: el?.getBoundingClientRect().top ?? null,
    });
  }, [marker]);

  return (
    <div
      ref={ref}
      data-home-probe={marker}
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
      aria-hidden
    />
  );
}

export function installHomeDebugListeners() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __danHomeDebug?: boolean };
  if (w.__danHomeDebug) return;
  w.__danHomeDebug = true;

  window.addEventListener("error", (ev) => {
    log("B", "HomeRenderProbe.tsx:error", "window error", {
      message: ev.message,
      filename: ev.filename,
      lineno: ev.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev.reason;
    log("B", "HomeRenderProbe.tsx:rejection", "unhandled rejection", {
      message: reason instanceof Error ? reason.message : String(reason),
    });
  });

  log("A", "HomeRenderProbe.tsx:boot", "debug listeners installed", {
    port: window.location.port,
    href: window.location.href,
    innerHeight: window.innerHeight,
  });
}
