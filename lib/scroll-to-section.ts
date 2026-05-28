import type { MouseEvent } from "react";

/** Strip leading `#` from hash links. */
export function sectionIdFromHref(href: string): string | null {
  if (!href.startsWith("#")) return null;
  const id = href.slice(1).trim();
  return id.length > 0 ? id : null;
}

/**
 * Smooth-scroll to an on-page section, respecting sticky header offset via
 * runtime nav height + section anchor gap CSS variable.
 */
export function scrollToSection(idOrHash: string): boolean {
  const id = idOrHash.startsWith("#") ? idOrHash.slice(1) : idOrHash;
  const el = document.getElementById(id);
  if (!el) return false;

  const rootStyles = getComputedStyle(document.documentElement);
  const navH = Number.parseFloat(
    rootStyles.getPropertyValue("--site-nav-current-height")
  );
  const anchorGap = Number.parseFloat(
    rootStyles.getPropertyValue("--section-anchor-gap")
  );
  const offset = (Number.isFinite(navH) ? navH : 0) + (Number.isFinite(anchorGap) ? anchorGap : 0);

  const top = window.scrollY + el.getBoundingClientRect().top - offset;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
  return true;
}

/** Handle in-page nav clicks — prevents empty `#` jumps. */
export function handleSectionNavClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  onAfterNavigate?: () => void
): void {
  const id = sectionIdFromHref(href);
  if (!id) return;
  e.preventDefault();
  // Close overlays/menus first, then compute final geometry and scroll.
  onAfterNavigate?.();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToSection(id);
    });
  });
}
