/**
 * Layer scale — background < content < nav < overlays < modals < assistant < toast.
 * Synced with CSS variables in globals.css.
 */
export const Z = {
  base: 0,
  content: 1,
  heroContent: 2,
  heroOverlay: 40,
  noise: 50,
  sticky: 60,
  nav: 100,
  navOverlay: 110,
  dropdown: 120,
  fab: 130,
  overlay: 150,
  modalBackdrop: 200,
  modal: 210,
  assistant: 220,
  toast: 230,
} as const;
