import Link from "next/link";

type AdminQuickLinksProps = {
  active?:
    | "bookings"
    | "leads"
    | "jobs"
    | "workshop-assistant"
    | "today";
};

const linkClass = (isActive: boolean) =>
  isActive
    ? "inline-flex min-h-9 items-center rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3.5 py-1.5 text-xs font-semibold text-[#e8d5a3] shadow-[0_0_0_1px_rgba(212,166,60,0.12)] transition hover:bg-[#d4a63c]/14"
    : "inline-flex min-h-9 items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-xs text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-zinc-200";

export function AdminQuickLinks({ active }: AdminQuickLinksProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2.5">
      <Link href="/admin/today" className={linkClass(active === "today")}>
        Today →
      </Link>
      <Link href="/admin/jobs" className={linkClass(active === "jobs")}>
        Jobs →
      </Link>
      <Link href="/admin/bookings" className={linkClass(active === "bookings")}>
        Bookings →
      </Link>
      <Link href="/admin/leads" className={linkClass(active === "leads")}>
        Customers →
      </Link>
      <Link
        href="/admin/workshop-assistant"
        className={linkClass(active === "workshop-assistant")}
      >
        Workshop Assistant →
      </Link>
    </div>
  );
}
