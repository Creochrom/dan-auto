"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Loader2 } from "lucide-react";
import { setPendingReferrer } from "@/lib/platform/store";
import { REFERRAL_CREDIT_GBP } from "@/lib/platform/seed";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code : "";

  useEffect(() => {
    if (code) {
      setPendingReferrer(code);
      const t = setTimeout(() => {
        router.replace("/#platform");
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [code, router]);

  return (
    <motion.div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="premium-card glow-cyan max-w-md rounded-3xl p-10"
      >
        <Gift className="mx-auto h-12 w-12 text-cyan" />
        <h1 className="mt-6 text-2xl font-light text-white">You&apos;ve been referred</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Referral <span className="font-mono text-cyan">{code}</span> applied. Create your
          account to unlock member benefits — you and your friend each earn £
          {REFERRAL_CREDIT_GBP} workshop credit after your first completed booking.
        </p>
        <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-cyan" />
        <p className="mt-4 text-xs text-zinc-500">Opening member hub…</p>
      </motion.div>
    </motion.div>
  );
}
