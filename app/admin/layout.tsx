import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin shell — CRM modules mount here.
 * TODO: Server-side auth guard + role-based access.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100">
      <div className="border-b border-white/[0.06] bg-black/80 px-4 py-3 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4a63c]">
          Dana Auto Centre · Workshop OS
        </p>
      </div>
      {children}
    </div>
  );
}
