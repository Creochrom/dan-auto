import Link from "next/link";
import { navLinks } from "@/lib/landing-data";

export function Footer() {
  return (
    <footer className="border-t border-white/8 pb-28 pt-16 md:pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div>
            <Link href="#" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-sm font-bold text-cyan">
                DA
              </span>
              <span className="text-sm font-semibold text-white">
                Dana Auto Centre
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-500">
              Premium automotive care for the UK&apos;s most discerning drivers.
              DVSA approved · Fully insured · EV certified.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 transition hover:text-cyan"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-8 text-xs text-zinc-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Dana Auto Centre. All rights reserved.</p>
          <p>Privacy · Terms · Cookies</p>
        </div>
      </div>
    </footer>
  );
}
