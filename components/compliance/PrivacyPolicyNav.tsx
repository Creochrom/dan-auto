"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

export function PrivacyPolicyNav() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-[#d4a63c]/15 bg-black/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-[#d4a63c]/40 hover:text-[#e8c96a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63c]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to website
        </button>
        <Link
          href="/"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/12 text-zinc-400 transition hover:border-[#d4a63c]/40 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63c]"
          aria-label="Close privacy policy"
        >
          <X className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
