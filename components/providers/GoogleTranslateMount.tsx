"use client";

import { useEffect } from "react";
import { mountGoogleTranslateWidget, readMachineTranslateFlag } from "@/lib/google-translate";

export function GoogleTranslateMount() {
  useEffect(() => {
    if (!readMachineTranslateFlag()) return;
    mountGoogleTranslateWidget();
  }, []);

  return null;
}
