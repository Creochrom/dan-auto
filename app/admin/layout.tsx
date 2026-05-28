import type { Metadata } from "next";
import { BRAND } from "@/lib/config/brand";
import { AdminShellNav } from "@/components/enterprise/AdminShellNav";
import { AdminWorkshopShell } from "@/components/workshop/AdminWorkshopShell";

export const metadata: Metadata = {
  title: "Workshop Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin shell — CRM modules mount here.
 * Page access is enforced by middleware + httpOnly session cookie.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100">
      <div className="border-b border-white/[0.06] bg-black/80 px-4 py-3 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4a63c]">
          {BRAND.shortName} · Workshop OS
        </p>
      </div>
      <AdminShellNav />
      <AdminWorkshopShell />
      {children}
    </div>
  );
}
