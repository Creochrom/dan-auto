export const SERVICES_CHILDREN = [
  { href: "#mot", label: "MOT testing" },
  { href: "#services", label: "Servicing & repairs" },
  { href: "#diagnostics", label: "Diagnostics" },
] as const;

/** Always visible on tablet (md+) and desktop */
export const NAV_PRIMARY = [
  { href: "#mot", label: "MOT" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
] as const;

/** Desktop (xl+) inline; tablet “More” dropdown; always in mobile panel */
export const NAV_SECONDARY = [
  { href: "#why-us", label: "Why us" },
  { href: "#members", label: "Members" },
  { href: "#reviews", label: "Reviews" },
] as const;

/** Tablet “More” menu — items hidden from the inline bar on narrower tablets */
export const NAV_MORE = [
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  ...NAV_SECONDARY,
] as const;

export const NAV_MOBILE = [
  ...NAV_PRIMARY,
  ...NAV_SECONDARY,
] as const;
