"use client";

import { Shield, Sparkles } from "lucide-react";
import { MOT_BOOKING_DEPOSIT_GBP } from "@/lib/membership";

type Props = {
  isMember: boolean;
  onBook: () => void;
  className?: string;
};

export function HeroBookingOffer({ isMember, onBook, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        isMember
          ? "border-[#d4a63c]/35 bg-[#d4a63c]/8"
          : "border-white/[0.08] bg-black/45"
      } ${className}`}
    >
      <div className="flex items-start gap-2">
        {isMember ? (
          <Sparkles className="h-4 w-4 shrink-0 text-[#d4a63c]" aria-hidden />
        ) : (
          <Shield className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        )}
        <p className="text-[10px] leading-relaxed text-zinc-300">
          {isMember ? (
            <>
              <span className="font-semibold text-[#f5e6b8]">
                Deposit-free priority booking
              </span>{" "}
              included with membership.
            </>
          ) : (
            <>
              Secure your MOT slot with a{" "}
              <span className="font-semibold text-white">
                refundable £{MOT_BOOKING_DEPOSIT_GBP} deposit
              </span>
              .
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onBook}
        className="btn-glow mt-2 flex w-full min-h-[34px] items-center justify-center rounded-lg text-[11px] font-bold text-black"
      >
        {isMember ? "Priority book now" : "Book with deposit"}
      </button>
    </div>
  );
}
