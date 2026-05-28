"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, Clock3, PhoneCall, Wrench } from "lucide-react";
import { BookingSlotStep } from "@/features/booking/components/BookingSlotStep";
import { IntakeProgressBar } from "@/features/booking/components/IntakeProgressBar";
import { useBookingFormState } from "@/features/booking/hooks/useBookingFormState";
import { useBookingPrefill } from "@/features/booking/hooks/useBookingPrefill";
import { useAssistant } from "@/features/assistant/AssistantContext";
import { createBooking } from "@/lib/api/client";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { openingHours } from "@/lib/config/hours";
import { BUSINESS } from "@/lib/config";
import { clearBookingPrefill } from "@/lib/booking-prefill";
import {
  formatPhoneInput,
  normalizeEmailInput,
  stripPhone,
} from "@/lib/format-contact";
import { stripPlate } from "@/lib/format-plate";

type Props = {
  onComplete?: () => void;
};

type FieldName =
  | "service"
  | "date"
  | "time"
  | "registration"
  | "customerName"
  | "customerPhone"
  | "customerEmail";

const PHONE_DIGIT_MIN = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingIntakeFlow({ onComplete }: Props) {
  const { openAssistant } = useAssistant();
  const { revision } = useBookingPrefill();
  const {
    mounted,
    showRegHint,
    fields,
    updateField,
    updateRegistration,
    dismissRegHint,
    persistCustomer,
  } = useBookingFormState(revision);

  const {
    service,
    date,
    time,
    registration,
    customerName,
    customerPhone,
    customerEmail,
    notes,
  } = fields;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    service: false,
    date: false,
    time: false,
    registration: false,
    customerName: false,
    customerPhone: false,
    customerEmail: false,
  });

  const fieldErrors = useMemo(() => {
    const phoneDigits = stripPhone(customerPhone);
    const emailTrimmed = customerEmail.trim();
    return {
      service: service ? "" : "Choose a service to continue.",
      date: date ? "" : "Choose your preferred date.",
      time: time ? "" : "Choose your preferred time.",
      registration:
        stripPlate(registration).length >= 2
          ? ""
          : "Enter a valid registration (at least 2 characters).",
      customerName:
        customerName.trim().length >= 2 ? "" : "Enter your name so we know who to call.",
      customerPhone:
        phoneDigits.length >= PHONE_DIGIT_MIN
          ? ""
          : "Enter a phone number with at least 10 digits.",
      customerEmail:
        !emailTrimmed || EMAIL_RE.test(emailTrimmed)
          ? ""
          : "Enter a valid email or leave this field empty.",
    };
  }, [service, date, time, registration, customerName, customerPhone, customerEmail]);

  const hasBlockingErrors = useMemo(
    () =>
      Boolean(
        fieldErrors.service ||
          fieldErrors.date ||
          fieldErrors.time ||
          fieldErrors.registration ||
          fieldErrors.customerName ||
          fieldErrors.customerPhone ||
          fieldErrors.customerEmail
      ),
    [fieldErrors]
  );

  const bookingContext = useMemo(
    () =>
      service && date && time
        ? { service, preferredDate: date, preferredTime: time }
        : null,
    [service, date, time]
  );

  const progressStep = done ? "confirm" : "schedule";

  const markTouched = useCallback((name: FieldName) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const updatePhone = useCallback(
    (value: string) => {
      updateField("customerPhone", formatPhoneInput(value));
    },
    [updateField]
  );

  const handleEmailBlur = useCallback(() => {
    markTouched("customerEmail");
    const normalized = normalizeEmailInput(customerEmail);
    if (normalized !== customerEmail) {
      updateField("customerEmail", normalized);
    }
  }, [markTouched, customerEmail, updateField]);

  const shouldShowError = useCallback(
    (name: FieldName) => Boolean(fieldErrors[name] && (submitAttempted || touched[name])),
    [fieldErrors, submitAttempted, touched]
  );

  const inputClass = useCallback(
    (name: FieldName) =>
      `input-premium w-full rounded-xl px-4 py-3 text-sm text-white ${
        shouldShowError(name) ? "ring-1 ring-rose-400/70" : ""
      }`,
    [shouldShowError]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitAttempted(true);
    if (hasBlockingErrors) {
      setSubmitError("Please correct the highlighted fields before sending.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createBooking({
        service,
        registration: stripPlate(registration),
        preferredDate: date,
        preferredTime: time,
        duration: "1h",
        customerName: customerName.trim(),
        customerPhone: stripPhone(customerPhone) || customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        source: "website",
      });
      persistCustomer(fields);
      clearBookingPrefill();
      setDone(true);
      onComplete?.();
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? `Could not send your request: ${e.message}`
          : "Could not send your request. Please call us if this keeps happening."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    hasBlockingErrors,
    service,
    registration,
    date,
    time,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    fields,
    persistCustomer,
    onComplete,
  ]);

  const handleNeedHelp = useCallback(() => {
    if (!bookingContext) return;
    openAssistant({
      registration: stripPlate(registration) || undefined,
      bookingContext,
      advisorRoute: {
        entry_point: "booking_form_help",
        intent: "booking",
        surface: "booking_flow",
      },
    });
  }, [openAssistant, registration, bookingContext]);

  const handleChangeSlot = useCallback(() => {
    setDone(false);
    setSubmitError(null);
  }, []);

  if (done) {
    return (
      <>
        <IntakeProgressBar current="confirm" />
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="py-8"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-medium text-white">
              {BOOKING_INTAKE_COPY.successTitle}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
              {BOOKING_INTAKE_COPY.successBody}
            </p>
            <p className="mt-4 text-xs text-zinc-500">
              {service} · {date} at {time}
              {registration ? ` · ${registration}` : ""}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              What happens next
            </p>
            <ol className="mt-3 space-y-3">
              <li className="flex items-start gap-3 text-sm text-zinc-300">
                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span>Our workshop reviews your request and notes.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-300">
                <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span>We call you to confirm the exact slot and any prep details.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-300">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span>
                  Call-backs are typically during workshop hours:{" "}
                  {openingHours.weekdays.hours} weekdays.
                </span>
              </li>
            </ol>
          </div>

          <button
            type="button"
            onClick={handleChangeSlot}
            className="mt-6 w-full text-sm font-medium text-cyan hover:underline"
          >
            {BOOKING_INTAKE_COPY.changeSlot}
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <IntakeProgressBar current={progressStep} />

      <BookingSlotStep
        service={service}
        date={date}
        time={time}
        onServiceChange={(v) => {
          updateField("service", v);
          markTouched("service");
        }}
        onDateChange={(v) => {
          updateField("date", v);
          markTouched("date");
        }}
        onTimeChange={(v) => {
          updateField("time", v);
          markTouched("time");
        }}
      />

      {(shouldShowError("service") || shouldShowError("date") || shouldShowError("time")) && (
        <p className="mt-3 text-xs text-rose-300">
          {fieldErrors.service || fieldErrors.date || fieldErrors.time}
        </p>
      )}

      <div className="mt-6 space-y-4 border-t border-white/8 pt-6">
        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.registrationLabel}
          </label>
          <input
            type="text"
            value={registration}
            onChange={(e) => updateRegistration(e.target.value)}
            onFocus={dismissRegHint}
            onBlur={() => markTouched("registration")}
            placeholder="e.g. AB12 CDE"
            className={`${inputClass("registration")} uppercase tracking-wider`}
            autoComplete="off"
            aria-invalid={shouldShowError("registration")}
          />
          {mounted && showRegHint && !shouldShowError("registration") && (
            <p className="mt-1.5 text-xs text-cyan/80">
              {BOOKING_INTAKE_COPY.registrationRemembered}
            </p>
          )}
          {shouldShowError("registration") && (
            <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.registration}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs text-zinc-500">
              {BOOKING_INTAKE_COPY.nameLabel}
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              onBlur={() => markTouched("customerName")}
              className={inputClass("customerName")}
              autoComplete="name"
              aria-invalid={shouldShowError("customerName")}
            />
            {shouldShowError("customerName") && (
              <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.customerName}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs text-zinc-500">
              {BOOKING_INTAKE_COPY.phoneLabel}
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => updatePhone(e.target.value)}
              onBlur={() => markTouched("customerPhone")}
              className={inputClass("customerPhone")}
              autoComplete="tel"
              inputMode="tel"
              placeholder="07XXX XXX XXX"
              aria-invalid={shouldShowError("customerPhone")}
            />
            {shouldShowError("customerPhone") && (
              <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.customerPhone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.emailLabel}
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) =>
              updateField("customerEmail", e.target.value.replace(/\s/g, ""))
            }
            onBlur={handleEmailBlur}
            className={inputClass("customerEmail")}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            spellCheck={false}
            aria-invalid={shouldShowError("customerEmail")}
          />
          {shouldShowError("customerEmail") && (
            <p className="mt-1.5 text-xs text-rose-300">{fieldErrors.customerEmail}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.notesLabel}
          </label>
          <textarea
            value={notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="input-premium w-full resize-none rounded-xl px-4 py-3 text-sm text-white"
            placeholder="Symptoms, warning lights, or anything we should know"
          />
        </div>

        {submitError && (
          <p
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="btn-glow w-full rounded-full py-3.5 text-sm font-semibold text-black disabled:opacity-40"
        >
          {submitting ? BOOKING_INTAKE_COPY.submittingBooking : BOOKING_INTAKE_COPY.submitBooking}
        </button>

        {bookingContext && (
          <button
            type="button"
            onClick={handleNeedHelp}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/8 px-4 py-3 text-sm font-medium text-[#e8d5a3] transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/12"
          >
            <Bot className="h-4 w-4 shrink-0" aria-hidden />
            {BOOKING_INTAKE_COPY.needHelpFirst}
          </button>
        )}
      </div>
    </>
  );
}

/** Marketing panel copy for the booking section grid */
export function BookingIntakeSidebar() {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan">
        {BOOKING_INTAKE_COPY.eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl">
        {BOOKING_INTAKE_COPY.title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
        {BOOKING_INTAKE_COPY.description}
      </p>
      <ul className="mt-8 space-y-3">
        {[
          "MOT, servicing, diagnostics & repairs",
          "Pick a slot and send your request in minutes",
          `${openingHours.weekdays.label} ${openingHours.weekdays.hours}`,
          `${openingHours.saturday.label} ${openingHours.saturday.hours}`,
          `A mechanic from ${BUSINESS.shortName} will call you back`,
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
            <Check className="h-4 w-4 shrink-0 text-cyan" />
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

