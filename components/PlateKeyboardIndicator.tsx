"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Globe, Languages } from "lucide-react";
import {
  KEYBOARD_LAYOUT_LABELS,
  type KeyboardLayoutHint,
} from "@/lib/keyboard-layout";

type Props = {
  layout: KeyboardLayoutHint;
  highlighted?: boolean;
};

const CODES: Record<KeyboardLayoutHint, string> = {
  en: "EN",
  pl: "PL",
  zh: "ZH",
  in: "IN",
  ro: "RO",
  pt: "PT",
  ua: "UA",
  ru: "RU",
  other: "··",
};

function FlagFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      width={14}
      height={9}
      viewBox="0 0 18 11"
      className="hero-plate-kbd-flag"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function UkFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="11" fill="#012169" />
      <path d="M0 0l18 11M18 0L0 11" stroke="#fff" strokeWidth="2.2" />
      <path d="M0 0l18 11M18 0L0 11" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M9 0v11M0 5.5h18" stroke="#fff" strokeWidth="3.2" />
      <path d="M9 0v11M0 5.5h18" stroke="#C8102E" strokeWidth="1.8" />
    </FlagFrame>
  );
}

function PlFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="5.5" fill="#fff" />
      <rect width="18" height="5.5" y="5.5" fill="#DC143C" />
    </FlagFrame>
  );
}

function CnFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="11" fill="#DE2910" />
      <polygon
        points="4.5,2 5.1,3.6 6.8,3.6 5.45,4.55 6,6.2 4.5,5.2 3,6.2 3.55,4.55 2.2,3.6 3.9,3.6"
        fill="#FFDE00"
      />
    </FlagFrame>
  );
}

function InFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="3.67" fill="#FF9933" />
      <rect width="18" height="3.67" y="3.67" fill="#fff" />
      <rect width="18" height="3.66" y="7.34" fill="#138808" />
      <circle cx="9" cy="5.5" r="1.1" fill="none" stroke="#000080" strokeWidth="0.35" />
    </FlagFrame>
  );
}

function RoFlag() {
  return (
    <FlagFrame>
      <rect width="6" height="11" fill="#002B7F" />
      <rect width="6" height="11" x="6" fill="#FCD116" />
      <rect width="6" height="11" x="12" fill="#CE1126" />
    </FlagFrame>
  );
}

function PtFlag() {
  return (
    <FlagFrame>
      <rect width="7" height="11" fill="#006600" />
      <rect width="11" height="11" x="7" fill="#FF0000" />
      <circle cx="7" cy="5.5" r="2" fill="#FFD700" opacity="0.9" />
    </FlagFrame>
  );
}

function UaFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="5.5" fill="#005BBB" />
      <rect width="18" height="5.5" y="5.5" fill="#FFD500" />
    </FlagFrame>
  );
}

function RuFlag() {
  return (
    <FlagFrame>
      <rect width="18" height="3.67" fill="#fff" />
      <rect width="18" height="3.67" y="3.67" fill="#0039A6" />
      <rect width="18" height="3.66" y="7.34" fill="#D52B1E" />
    </FlagFrame>
  );
}

const FLAG_BY_LAYOUT: Record<
  Exclude<KeyboardLayoutHint, "other">,
  () => ReactNode
> = {
  en: UkFlag,
  pl: PlFlag,
  zh: CnFlag,
  in: InFlag,
  ro: RoFlag,
  pt: PtFlag,
  ua: UaFlag,
  ru: RuFlag,
};

export function PlateKeyboardIndicator({ layout, highlighted = false }: Props) {
  const Flag = layout === "other" ? null : FLAG_BY_LAYOUT[layout];

  if (highlighted) {
    return (
      <div
        className="hero-plate-kbd hero-plate-kbd--warning hero-plate-kbd--highlight"
        role="img"
        aria-label="Wrong keyboard layout — use English letters and numbers only"
        title="Wrong keyboard layout — use English letters and numbers only"
      >
        <Languages className="hero-plate-kbd-warn-icon" strokeWidth={2.25} aria-hidden />
        <AlertTriangle className="hero-plate-kbd-warn-badge" strokeWidth={2.5} aria-hidden />
        <span className="hero-plate-kbd-label">!</span>
      </div>
    );
  }

  return (
    <div
      className={`hero-plate-kbd hero-plate-kbd--${layout}`}
      role="img"
      aria-label={KEYBOARD_LAYOUT_LABELS[layout]}
      title={KEYBOARD_LAYOUT_LABELS[layout]}
    >
      {Flag ? (
        <Flag />
      ) : (
        <Globe
          className="hero-plate-kbd-globe h-3.5 w-3.5 text-white/85"
          strokeWidth={2}
          aria-hidden
        />
      )}
      <span className="hero-plate-kbd-label">{CODES[layout]}</span>
    </div>
  );
}
