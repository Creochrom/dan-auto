"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { DanAutoCentreLogo } from "@/components/brand/DanAutoCentreLogo";
import { useI18n } from "@/components/providers/I18nProvider";
import { NAV_HOME_SECTION_ID, NAV_MAIN } from "@/lib/nav-config";
import { useBookVisit } from "@/features/booking/hooks/useBookVisit";
import { handleSectionNavClick } from "@/lib/scroll-to-section";

const EASE = [0.22, 1, 0.36, 1] as const;

type SiteHeaderProps = {
  phone: string;
  phoneHref: string;
};

function NavItem({
  href,
  label,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  className: string;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => handleSectionNavClick(e, href, onNavigate)}
    >
      {label}
    </a>
  );
}

function SectionCta({
  href,
  className,
  children,
  onNavigate,
  onClick,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onNavigate?: () => void;
  onClick?: (e: MouseEvent<HTMLAnchorElement>, onNavigate?: () => void) => void;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (onClick) {
          onClick(e, onNavigate);
          return;
        }
        handleSectionNavClick(e, href, onNavigate);
      }}
    >
      {children}
    </a>
  );
}

export function SiteHeader({ phone, phoneHref }: SiteHeaderProps) {
  const { isLocalizedExperience, messages, returnToEnglish } = useI18n();
  const bookVisit = useBookVisit();
  const headerRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [useCompactNav, setUseCompactNav] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setUseCompactNav(mq.matches);
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

  useLayoutEffect(() => {
    const root = document.documentElement;
    const header = headerRef.current;
    if (!header) return;

    const applyHeight = () => {
      const rect = header.getBoundingClientRect();
      const px = `${Math.max(0, Math.round(rect.height))}px`;
      root.style.setProperty("--site-nav-current-height", px);
    };

    applyHeight();

    const resizeObserver = new ResizeObserver(applyHeight);
    resizeObserver.observe(header);
    window.addEventListener("resize", applyHeight, { passive: true });
    window.addEventListener("scroll", applyHeight, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", applyHeight);
      window.removeEventListener("scroll", applyHeight);
      root.style.removeProperty("--site-nav-current-height");
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleBookNav = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, onNavigate?: () => void) => {
      handleSectionNavClick(e, "#booking", () => {
        bookVisit(undefined, { scroll: false });
        onNavigate?.();
      });
    },
    [bookVisit]
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeAll]);

  /** Defer breakpoint-specific chrome until after mount to avoid SSR/client nav mismatches. */
  const showInlineNav = !mounted || !useCompactNav;
  const showHamburger = mounted && useCompactNav;

  const mobileMenu =
    mounted && useCompactNav && !isLocalizedExperience
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
                    {NAV_MAIN.map((link) => (
                      <NavItem
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        className="site-nav-panel-link w-full border-b border-white/[0.06] text-left"
                        onNavigate={closeAll}
                      />
                    ))}

                    <a href={phoneHref} onClick={closeAll} className="site-nav-panel-phone">
                      <Phone className="h-5 w-5 shrink-0 text-[#d4a63c]" aria-hidden />
                      {phone}
                    </a>

                    <SectionCta
                      href="#booking"
                      className="site-nav-book site-nav-panel-cta"
                      onNavigate={closeAll}
                      onClick={handleBookNav}
                    >
                      Book your visit
                    </SectionCta>
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
        ref={headerRef}
        className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div className="site-nav-inner">
          <div className="site-nav-brand">
            <DanAutoCentreLogo
              href={`#${NAV_HOME_SECTION_ID}`}
              onNavigate={closeAll}
            />
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
                className={`site-nav-center min-w-0 ${showInlineNav ? "site-nav-center--visible" : "site-nav-center--hidden"}`}
                aria-label="Main"
              >
                {NAV_MAIN.map((link) => (
                  <NavItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    className="site-nav-link site-nav-link--compact lg:site-nav-link--full"
                  />
                ))}
              </nav>

              <div className="site-nav-end">
                <a
                  href={phoneHref}
                  className={`site-nav-phone ${useCompactNav ? "site-nav-phone--compact inline-flex" : "hidden md:inline-flex"}`}
                >
                  <Phone className="h-[18px] w-[18px] shrink-0 text-[#d4a63c]" strokeWidth={1.75} aria-hidden />
                  {useCompactNav ? (
                    <span>Call</span>
                  ) : (
                    <>
                      <span className="hidden xl:inline">{phone}</span>
                      <span className="xl:hidden">Call</span>
                    </>
                  )}
                </a>

                <SectionCta
                  href="#booking"
                  className="site-nav-book"
                  onClick={handleBookNav}
                >
                  <span className="hidden sm:inline">Book your visit</span>
                  <span className="sm:hidden">Book</span>
                </SectionCta>

                <button
                  type="button"
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  aria-controls="site-mobile-nav"
                  className={`site-nav-menu-btn ${showHamburger ? "site-nav-menu-btn--visible" : ""}`}
                  onClick={() => setMenuOpen(true)}
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
