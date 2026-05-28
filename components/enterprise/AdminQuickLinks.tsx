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
    ? "rounded-lg border border-[#d4a63c]/30 px-3 py-1.5 text-xs font-semibold text-[#d4a63c] hover:bg-[#d4a63c]/10"
    : "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20";

export function AdminQuickLinks({ active }: AdminQuickLinksProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
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
