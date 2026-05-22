"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/lib/landing-data";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 px-4 pt-4 transition-all duration-500 md:px-6`}
      >
        <nav
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 md:px-6 ${
            scrolled ? "glass glow-cyan shadow-lg" : "glass"
          }`}
        >
          <Link href="#" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-sm font-bold text-cyan ring-1 ring-cyan/30">
              DA
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-white">
                Dan Auto Centre
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                Premium Garage
              </p>
            </div>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-cyan"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <motion.div
            className="hidden items-center gap-3 md:flex"
            initial={false}
          >
            <a
              href="tel:+441234567890"
              className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-cyan" />
              01234 567 890
            </a>
            <a
              href="#booking"
              className="rounded-full bg-cyan px-5 py-2 text-sm font-medium text-black transition hover:bg-cyan/90"
            >
              Book now
            </a>
          </motion.div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl md:hidden"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="flex h-full flex-col px-6 pb-32 pt-28"
            >
              <ul className="flex flex-col gap-6">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-2xl font-light text-white"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a
                href="#booking"
                onClick={() => setOpen(false)}
                className="mt-10 rounded-full bg-cyan py-4 text-center text-base font-medium text-black"
              >
                Book appointment
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
