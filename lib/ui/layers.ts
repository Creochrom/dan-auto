import { Z } from "@/lib/ui/z-index";

/** Tailwind z-index classes synced with Z scale */
export const LAYER = {
  dropdown: `z-[${Z.dropdown}]`,
  fab: `z-[${Z.fab}]`,
  overlay: `z-[${Z.overlay}]`,
  modalBackdrop: `z-[${Z.modalBackdrop}]`,
  modal: `z-[${Z.modal}]`,
  assistant: `z-[${Z.assistant}]`,
  toast: `z-[${Z.toast}]`,
} as const;
