/** Services dropdown — matches section anchors (desktop nav mega-item) */
export const SERVICES_CHILDREN = [
  { href: "#services", label: "Servicing & repairs" },
  { href: "#mot", label: "MOT testing" },
  { href: "#diagnostics", label: "Diagnostics" },
] as const;

/** Primary nav links after Services dropdown — no duplicate "Services" */
export const NAV_PRIMARY = [
  { href: "#mot", label: "MOT" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#booking", label: "Book online" },
  { href: "#ai-advisor", label: "AI advisor", advisor: true as const },
] as const;

export const NAV_SECONDARY = [
  { href: "#why-us", label: "Why us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
] as const;

export const NAV_MORE = [
  { href: "#about", label: "About" },
  { href: "#ai-quote", label: "Get estimate" },
  { href: "#members", label: "Members" },
] as const;

/** Mobile drawer — Services accordion is separate; no duplicate Services link */
export const NAV_MOBILE = [
  ...NAV_PRIMARY,
  { href: "#why-us", label: "Why us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#about", label: "About" },
  { href: "#ai-quote", label: "Get estimate" },
  { href: "#members", label: "Members" },
  { href: "#contact", label: "Contact" },
] as const;
