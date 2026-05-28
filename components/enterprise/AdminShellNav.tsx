"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
      className="border-b border-white/[0.08] bg-black/60 px-4 py-3 sm:px-6"
      aria-label="Workshop admin"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
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
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#d4a63c]/15 text-[#d4a63c] ring-1 ring-[#d4a63c]/35"
                  : highlight
                    ? "border border-cyan/30 text-cyan hover:bg-cyan/10"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
