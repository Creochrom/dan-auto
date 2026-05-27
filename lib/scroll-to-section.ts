import type { MouseEvent } from "react";

/** Strip leading `#` from hash links. */
export function sectionIdFromHref(href: string): string | null {
  if (!href.startsWith("#")) return null;
  const id = href.slice(1).trim();
  return id.length > 0 ? id : null;
}

/**
 * Smooth-scroll to an on-page section, respecting sticky header offset via
 * `scroll-padding-top` / section `scroll-margin` in global CSS.
 */
export function scrollToSection(idOrHash: string): boolean {
  const id = idOrHash.startsWith("#") ? idOrHash.slice(1) : idOrHash;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
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
  scrollToSection(id);
  onAfterNavigate?.();
}
