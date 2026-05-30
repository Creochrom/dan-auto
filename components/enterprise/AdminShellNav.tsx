"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Calendar,
  LayoutDashboard,
  Users,
  Wrench,
} from "lucide-react";

const NAV = [
  { href: "/admin/today", label: "Today", icon: LayoutDashboard, exact: true },
  { href: "/admin/jobs", label: "Jobs", icon: Wrench },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/leads", label: "Customers", icon: Users },
  { href: "/admin/docs", label: "Documentation", icon: BookOpenText },
  {
    href: "/admin/workshop-assistant",
    label: "Workshop Assistant",
    icon: Wrench,
    highlight: true,
  },
] as const;

export function AdminShellNav() {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <nav
      className="border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,6,6,0.9),rgba(3,3,3,0.86))] px-4 py-3 backdrop-blur-md sm:px-6"
      aria-label="Workshop admin"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5">
        {NAV.map((item) => {
          const { href, label, icon: Icon } = item;
          const exact = "exact" in item ? item.exact : false;
          const highlight = "highlight" in item ? item.highlight : false;
          const active = exact
            ? pathname === href || pathname === "/admin"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-[#d4a63c]/35 bg-[#d4a63c]/12 text-[#e8d5a3] shadow-[0_0_0_1px_rgba(212,166,60,0.12)]"
                  : highlight
                    ? "border-cyan/35 bg-cyan/8 text-cyan hover:border-cyan/55 hover:bg-cyan/12"
                    : "border-white/[0.08] text-zinc-400 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
