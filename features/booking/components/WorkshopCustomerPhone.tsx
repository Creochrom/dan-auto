"use client";

import { Phone } from "lucide-react";
import { formatPhoneDisplay, phoneTelHref } from "@/lib/format-contact";

type Props = {
  phone: string;
  /** Large tap target in booking cards; compact elsewhere. */
  variant?: "prominent" | "inline";
  className?: string;
};

/** Single formatted, clickable customer phone for workshop cards. */
export function WorkshopCustomerPhone({
  phone,
  variant = "prominent",
  className = "",
}: Props) {
  const display = formatPhoneDisplay(phone);
  const href = phoneTelHref(phone);

  if (!display) return null;

  const base =
    variant === "prominent"
      ? "mt-2 inline-flex items-center gap-2 text-lg font-semibold text-emerald-300 transition hover:text-emerald-200"
      : "inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 transition hover:text-emerald-200";

  return (
    <a href={href} className={`${base} ${className}`.trim()}>
      <Phone
        className={variant === "prominent" ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0"}
        aria-hidden
      />
      {display}
    </a>
  );
}
