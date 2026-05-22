"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { DanAutoCentreLogo } from "@/components/brand/DanAutoCentreLogo";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAssistant } from "@/features/assistant/AssistantContext";
import {
  NAV_MOBILE,
  NAV_MORE,
  NAV_PRIMARY,
  NAV_SECONDARY,
  SERVICES_CHILDREN,
} from "@/lib/nav-config";

const EASE = [0.22, 1, 0.36, 1] as const;

type SiteHeaderProps = {
  phone: string;
  phoneHref: string;
};

function NavDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
  menuClassName = "",
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  menuClassName?: string;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className="site-nav-link inline-flex items-center gap-1"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-75 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={`site-nav-dropdown ${menuClassName}`}
          >
            {items.map((item) => (
              <a
                key={item.href}
                role="menuitem"
                href={item.href}
                className="site-nav-dropdown-item"
                onClick={onClose}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  href,
  label,
  advisor,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  advisor?: boolean;
  className: string;
  onNavigate?: () => void;
}) {
  const { openAssistant } = useAssistant();
  if (advisor) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          openAssistant();
          onNavigate?.();
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <a href={href} className={className} onClick={onNavigate}>
      {label}
    </a>
  );
}

export function SiteHeader({ phone, phoneHref }: SiteHeaderProps) {
  const { isLocalizedExperience, messages, returnToEnglish } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navCenterRef = useRef<HTMLDivElement>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobileViewport(mq.matches);
    syncViewport();
    mq.addEventListener("change", syncViewport);
    return () => mq.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setServicesOpen(false);
    setMoreOpen(false);
    setMobileServicesOpen(false);
  }, []);

  const closeDropdowns = useCallback(() => {
    setServicesOpen(false);
    setMoreOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeAll]);

  useEffect(() => {
    if (!servicesOpen && !moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!navCenterRef.current?.contains(e.target as Node)) {
        closeDropdowns();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdowns();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen, moreOpen, closeDropdowns]);

  const openMenu = useCallback(() => {
    closeDropdowns();
    setMenuOpen(true);
  }, [closeDropdowns]);

  const showInlineNav = !isMobileViewport;
  const showHamburger = isMobileViewport;

  const mobileMenu =
    mounted && !isLocalizedExperience
      ? createPortal(
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="mobile-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="site-nav-overlay"
              >
                <button
                  type="button"
                  className="site-nav-overlay-dismiss"
                  aria-label="Close menu"
                  onClick={closeAll}
                />
                <motion.aside
                  role="dialog"
                  aria-modal="true"
                  aria-label="Navigation menu"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.38, ease: EASE }}
                  id="site-mobile-nav"
                  className="site-nav-panel"
                >
                  <div className="site-nav-panel-header">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d4a63c]">
                      Menu
                    </p>
                    <button
                      type="button"
                      className="site-nav-menu-btn"
                      aria-label="Close menu"
                      onClick={closeAll}
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </div>

                  <nav className="site-nav-panel-body" aria-label="Mobile">
                    <div className="border-b border-white/[0.06]">
                      <button
                        type="button"
                        className="site-nav-panel-link flex w-full items-center justify-between"
                        onClick={() => setMobileServicesOpen((o) => !o)}
                        aria-expanded={mobileServicesOpen}
                      >
                        Services
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-[#d4a63c] transition ${mobileServicesOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </button>
                      <AnimatePresence>
                        {mobileServicesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pb-2 pl-1"
                          >
                            {SERVICES_CHILDREN.map((item) => (
                              <a
                                key={item.href}
                                href={item.href}
                                onClick={closeAll}
                                className="site-nav-panel-sublink"
                              >
                                {item.label}
                              </a>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {NAV_MOBILE.map((link) => (
                      <NavItem
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        advisor={"advisor" in link && link.advisor === true}
                        className="site-nav-panel-link w-full border-b border-white/[0.06] text-left"
                        onNavigate={closeAll}
                      />
                    ))}

                    <a href={phoneHref} onClick={closeAll} className="site-nav-panel-phone">
                      <Phone className="h-5 w-5 shrink-0 text-[#d4a63c]" aria-hidden />
                      {phone}
                    </a>

                    <a href="#booking" onClick={closeAll} className="site-nav-book site-nav-panel-cta">
                      Book now
                    </a>
                  </nav>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <header
        className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div className="site-nav-inner">
          <div className="site-nav-brand">
            <DanAutoCentreLogo href="#" />
          </div>

          {isLocalizedExperience ? (
            <div className="site-nav-end">
              <button
                type="button"
                onClick={returnToEnglish}
                className="rounded-full border border-[#d4a63c]/30 bg-[#d4a63c]/10 px-4 py-2 text-[13px] font-medium text-[#f5e6b8]"
              >
                {messages.returnToEnglish}
              </button>
            </div>
          ) : (
            <>
              <nav
                ref={navCenterRef}
                className={`site-nav-center min-w-0 ${showInlineNav ? "site-nav-center--visible" : "site-nav-center--hidden"}`}
                aria-label="Main"
              >
                <NavDropdown
                  label="Services"
                  items={SERVICES_CHILDREN}
                  open={servicesOpen}
                  onToggle={() => {
                    setMoreOpen(false);
                    setServicesOpen((o) => !o);
                  }}
                  onClose={() => setServicesOpen(false)}
                  menuClassName="site-nav-dropdown--left"
                />
                {NAV_PRIMARY.map((link) => (
                  <NavItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    advisor={"advisor" in link && link.advisor === true}
                    className="site-nav-link site-nav-link--compact xl:site-nav-link--full"
                  />
                ))}
                {NAV_SECONDARY.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="site-nav-link site-nav-link--secondary hidden xl:inline-flex"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="shrink-0 xl:hidden">
                  <NavDropdown
                    label="More"
                    items={NAV_MORE}
                    open={moreOpen}
                    onToggle={() => {
                      setServicesOpen(false);
                      setMoreOpen((o) => !o);
                    }}
                    onClose={() => setMoreOpen(false)}
                    menuClassName="site-nav-dropdown--left"
                  />
                </div>
              </nav>

              <div className="site-nav-end">
                <a href={phoneHref} className="site-nav-phone hidden md:inline-flex">
                  <Phone className="h-[18px] w-[18px] shrink-0 text-[#d4a63c]" strokeWidth={1.75} aria-hidden />
                  <span className="hidden xl:inline">{phone}</span>
                  <span className="xl:hidden">Call</span>
                </a>

                <a href="#booking" className="site-nav-book">
                  <span className="hidden sm:inline">Book now</span>
                  <span className="sm:hidden">Book</span>
                </a>

                <button
                  type="button"
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  aria-controls="site-mobile-nav"
                  className={`site-nav-menu-btn ${showHamburger ? "site-nav-menu-btn--visible" : ""}`}
                  onClick={openMenu}
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {mobileMenu}
    </>
  );
}
