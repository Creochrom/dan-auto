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
    <div className="admin-app min-h-screen text-zinc-100">
      <div className="border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(8,8,8,0.94),rgba(4,4,4,0.88))] px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d4a63c]">
            {BRAND.shortName} · Workshop OS
          </p>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Live workshop
          </span>
        </div>
      </div>
      <AdminShellNav />
      <AdminWorkshopShell />
      {children}
    </div>
  );
}
