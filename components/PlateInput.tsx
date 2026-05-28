"use client";

import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Loader2, Search } from "lucide-react";
import { PlateKeyboardIndicator } from "@/components/PlateKeyboardIndicator";
import { useKeyboardLayoutIndicator } from "@/hooks/useKeyboardLayoutIndicator";
import { formatPlate, stripPlate } from "@/lib/format-plate";
import {
  playPlateInvalidBeep,
  primePlateAudio,
  pulsePlateInvalidHaptic,
} from "@/lib/plate-input-feedback";
import {
  findInvalidPlateChars,
  hasInvalidPlateChars,
  isAllowedPlateChar,
  isInvalidPlateChar,
} from "@/lib/plate-input-rules";

export type PlateInputId = "hero" | "quote" | "book";

export type PlateInputProps = {
  id: PlateInputId;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  compact?: boolean;
  loading?: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  variant?: "classic" | "luxury";
  submitLabel?: string;
  luxuryShowSubmitLabelAlways?: boolean;
  alwaysEnableSubmit?: boolean;
  loadingLabel?: string;
  /** Brief outer shake on hero glass when invalid characters are blocked */
  onInvalidInput?: () => void;
};

function alnumCountBefore(str: string, index: number) {
  let n = 0;
  for (let i = 0; i < index && i < str.length; i++) {
    if (/[a-zA-Z0-9]/i.test(str[i]!)) n++;
  }
  return n;
}

function cursorPosForAlnumCount(formatted: string, count: number): number {
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[a-zA-Z0-9]/.test(formatted[i]!)) {
      seen++;
      if (seen === count) return i + 1;
    }
  }
  return formatted.length;
}

function PlateInputInner({
  id,
  value,
  onChange,
  onSubmit,
  compact,
  loading,
  focused,
  onFocus,
  onBlur,
  variant = "classic",
  submitLabel,
  luxuryShowSubmitLabelAlways,
  alwaysEnableSubmit,
  loadingLabel,
  onInvalidInput,
}: PlateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorAlnumTarget = useRef(0);
  const [layoutWarning, setLayoutWarning] = useState(false);
  const [fieldShake, setFieldShake] = useState(false);
  const [validTypingGlow, setValidTypingGlow] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validGlowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    layout: keyboardLayout,
    observeKey,
    explicitSelection,
  } = useKeyboardLayoutIndicator();

  const triggerInvalidFeedback = useCallback(
    (keySample?: string) => {
      if (keySample) observeKey(keySample);
      setValidTypingGlow(false);
      setLayoutWarning(true);
      playPlateInvalidBeep();
      pulsePlateInvalidHaptic();
      onInvalidInput?.();

      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      setFieldShake(false);
      requestAnimationFrame(() => {
        setFieldShake(true);
        shakeTimer.current = setTimeout(() => setFieldShake(false), 380);
      });
    },
    [observeKey, onInvalidInput]
  );

  const acknowledgeValidTyping = useCallback(() => {
    setLayoutWarning(false);
    setValidTypingGlow(true);
    if (validGlowTimer.current) clearTimeout(validGlowTimer.current);
    validGlowTimer.current = setTimeout(() => setValidTypingGlow(false), 280);
  }, []);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || document.activeElement !== el) return;
    const pos = cursorPosForAlnumCount(value, cursorAlnumTarget.current);
    const apply = () => {
      if (document.activeElement !== el) return;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* noop */
      }
    };
    requestAnimationFrame(apply);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target;
      const invalid = findInvalidPlateChars(el.value);
      if (invalid.length > 0) {
        triggerInvalidFeedback(invalid[0]);
      } else {
        acknowledgeValidTyping();
      }
      const beforeCount = alnumCountBefore(el.value, el.selectionStart ?? 0);
      const formatted = formatPlate(el.value);
      cursorAlnumTarget.current = Math.min(beforeCount, stripPlate(formatted).length);
      onChange(formatted);
    },
    [onChange, triggerInvalidFeedback, acknowledgeValidTyping]
  );

  const handlePlateKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (loading || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;

      if (isInvalidPlateChar(e.key)) {
        triggerInvalidFeedback(e.key);
        return;
      }

      if (isAllowedPlateChar(e.key)) {
        observeKey(e.key);
        acknowledgeValidTyping();
      }
    },
    [loading, observeKey, triggerInvalidFeedback, acknowledgeValidTyping]
  );

  const handlePlatePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      if (!text) return;

      const invalid = findInvalidPlateChars(text);
      if (invalid.length === 0) {
        acknowledgeValidTyping();
        return;
      }

      e.preventDefault();
      triggerInvalidFeedback(invalid[0]);

      const cleaned = text.replace(/[^a-zA-Z0-9 ]/g, "");
      if (!cleaned) return;

      const el = e.currentTarget;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const merged = `${el.value.slice(0, start)}${cleaned}${el.value.slice(end)}`;
      const formatted = formatPlate(merged);
      cursorAlnumTarget.current = stripPlate(formatted).length;
      onChange(formatted);
    },
    [onChange, triggerInvalidFeedback]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      const data = e.data ?? "";
      const invalid = findInvalidPlateChars(data);
      if (invalid.length > 0) {
        triggerInvalidFeedback(invalid[0]);
      }
    },
    [triggerInvalidFeedback]
  );

  const plateFieldClass =
    `hero-plate-field ${
      focused || loading ? "hero-plate-field--focused" : ""
    } ${loading ? "hero-plate-field--loading" : ""} ${
      layoutWarning ? "hero-plate-field--invalid" : ""
    } ${fieldShake ? "hero-plate-field--shake" : ""} ${
      validTypingGlow && !layoutWarning ? "hero-plate-field--valid-typing" : ""
    }`;

  const luxury = variant === "luxury";
  const isHero = id === "hero";
  const canonicalLen = stripPlate(value).length;
  const buttonLabel = loading
    ? (loadingLabel ?? "Analyzing…")
    : (submitLabel ?? "Lookup");

  const trySubmit = useCallback(() => {
    if (loading) return;
    if (!alwaysEnableSubmit && canonicalLen < 2) return;
    onSubmit?.();
  }, [loading, alwaysEnableSubmit, canonicalLen, onSubmit]);

  if (luxury && isHero) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          trySubmit();
        }}
        className="w-full"
      >
        <div className={plateFieldClass}>
          <PlateKeyboardIndicator
            layout={keyboardLayout}
            highlighted={layoutWarning}
            explicitSelection={explicitSelection}
          />
          <input
            ref={inputRef as RefObject<HTMLInputElement | null>}
            id={`plate-${id}`}
            name={`registration-${id}`}
            type="text"
            inputMode="text"
            autoComplete="off"
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="AB12 CDE"
            value={value}
            onChange={handleChange}
            onKeyDown={handlePlateKeyDown}
            onPaste={handlePlatePaste}
            onCompositionEnd={handleCompositionEnd}
            onFocus={(e) => {
              primePlateAudio();
              cursorAlnumTarget.current = alnumCountBefore(
                e.target.value,
                e.target.selectionStart ?? 0
              );
              onFocus();
            }}
            readOnly={loading}
            aria-busy={loading}
            onBlur={(e) => {
              if (!hasInvalidPlateChars(e.target.value)) {
                setLayoutWarning(false);
                setFieldShake(false);
              }
              onBlur();
            }}
            className="hero-plate-input"
            aria-label="UK vehicle registration"
          />
          <button
            type="submit"
            disabled={loading}
            className={`hero-plate-submit ${loading ? "hero-plate-submit--loading" : ""}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className="truncate">{buttonLabel}</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        trySubmit();
      }}
      className="w-full"
    >
      <div
        className={
          luxury
            ? `flex items-stretch overflow-hidden rounded-2xl border bg-black/82 shadow-xl backdrop-blur-md transition-[border-color,box-shadow] duration-300 sm:rounded-3xl ${
                focused || loading
                  ? "hero-plate-shell border-[#d4a63c]/55 shadow-[0_0_52px_rgba(212,166,60,0.25)]"
                  : "border-[#d4a63c]/28 shadow-[inset_0_1px_0_rgba(248,237,203,0.06)]"
              }`
            : `flex overflow-hidden rounded-xl border-2 shadow-lg transition-[border-color,box-shadow] duration-300 ${
                focused ? "border-amber-500/70 shadow-[0_0_40px_rgba(201,162,39,0.35)]" : "border-black/30"
              }`
        }
      >
        <div
          className={
            luxury
              ? "flex shrink-0 flex-col items-center justify-center gap-0.5 self-stretch border-r border-white/8 bg-[#061a5c] px-2 py-2 text-white sm:px-3 sm:py-2.5"
              : "flex flex-col items-center justify-center bg-[#003399] px-2.5 py-2.5 text-white sm:px-3"
          }
          aria-hidden
        >
          {luxury && (
            <svg
              width={18}
              height={11}
              viewBox="0 0 18 11"
              className="overflow-hidden rounded-[1px] opacity-95"
              aria-hidden
            >
              <rect width="18" height="11" fill="#012169" />
              <path d="M0 0l18 11M18 0L0 11" stroke="#fff" strokeWidth="2.2" />
              <path d="M0 0l18 11M18 0L0 11" stroke="#C8102E" strokeWidth="1.2" />
              <path d="M9 0v11M0 5.5h18" stroke="#fff" strokeWidth="3.2" />
              <path d="M9 0v11M0 5.5h18" stroke="#C8102E" strokeWidth="1.8" />
            </svg>
          )}
          <span
            className={`font-bold uppercase leading-none ${luxury ? "text-[9px] tracking-wide sm:text-[10px]" : "text-[10px]"}`}
          >
            GB
          </span>
          <span
            className={`uppercase opacity-85 ${luxury ? "text-[7px]" : "mt-0.5 text-[8px]"}`}
          >
            UK
          </span>
        </div>
        <input
          ref={inputRef as RefObject<HTMLInputElement | null>}
          id={`plate-${id}`}
          name={`registration-${id}`}
          type="text"
          inputMode="text"
          autoComplete="off"
          enterKeyHint="search"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={luxury ? "WP56 YAD" : "AB12 CDE"}
          value={value}
          onChange={handleChange}
          onKeyDown={handlePlateKeyDown}
          onPaste={handlePlatePaste}
          onCompositionEnd={handleCompositionEnd}
          onFocus={(e) => {
            primePlateAudio();
            cursorAlnumTarget.current = alnumCountBefore(
              e.target.value,
              e.target.selectionStart ?? 0
            );
            onFocus();
          }}
          readOnly={loading}
          aria-busy={loading}
          onBlur={onBlur}
          className={
            luxury
              ? `plate-input min-w-0 flex-1 self-stretch bg-gradient-to-b from-[#0c0b09] to-[#050505] font-mono font-bold uppercase tracking-[0.14em] text-[#d4a63c] caret-[#d4a63c] placeholder:text-[#d4a63c]/35 selection:bg-[#d4a63c]/25 selection:text-[#fff6dc] focus:outline-none disabled:opacity-92 ${
                  compact
                    ? "px-3 py-2.5 text-base sm:text-lg"
                    : "px-3 py-3 text-lg sm:px-5 sm:py-4 sm:text-2xl"
                }`
              : `plate-input min-w-0 flex-1 bg-[#F9D71C] font-bold uppercase text-black placeholder:text-black/30 focus:outline-none disabled:opacity-80 ${
                  compact
                    ? "px-3 py-2.5 text-base sm:text-lg"
                    : "px-3 py-3 text-lg sm:px-4 sm:py-3.5 sm:text-2xl"
                }`
          }
          aria-label="UK vehicle registration"
        />
        <button
          type="submit"
          disabled={loading || (!alwaysEnableSubmit && canonicalLen < 2)}
          className={
            luxury
              ? `btn-glow flex shrink-0 items-center justify-center gap-2 self-stretch border-l border-[#d4a63c]/20 font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  compact ? "px-3.5 sm:px-4" : "px-4 sm:px-5"
                }`
              : `flex items-center gap-1 bg-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                  compact ? "px-3" : "px-3 sm:px-4"
                }`
          }
        >
          {loading ? (
            <Loader2
              className={`animate-spin ${compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"}`}
              aria-hidden
            />
          ) : (
            <Search className={compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"} aria-hidden />
          )}
          {!compact && (
            <span
              className={`max-w-[7.5rem] truncate text-sm font-semibold ${luxury && luxuryShowSubmitLabelAlways ? "inline" : "hidden sm:inline"}`}
            >
              {buttonLabel}
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

export const PlateInput = memo(PlateInputInner);
PlateInput.displayName = "PlateInput";
