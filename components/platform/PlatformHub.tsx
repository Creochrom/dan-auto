"use client";

import { useState } from "react";
import { CustomerBenefits } from "./CustomerBenefits";
import { MemberHub } from "./MemberHub";
import type { SavedVehicle } from "@/lib/platform/types";

export type PlatformHubProps = {
  detectedVehicle?: SavedVehicle | null;
  bookDoneTick?: number;
  focusSignup?: boolean;
};

export function PlatformHub({
  detectedVehicle,
  bookDoneTick = 0,
  focusSignup: focusSignupProp = false,
}: PlatformHubProps) {
  const [focusSignupLocal, setFocusSignupLocal] = useState(false);
  const focusSignup = focusSignupProp || focusSignupLocal;

  return (
    <>
      <CustomerBenefits onCreateAccount={() => setFocusSignupLocal(true)} />
      <MemberHub
        detectedVehicle={detectedVehicle}
        bookDoneTick={bookDoneTick}
        focusSignup={focusSignup}
      />
    </>
  );
}
