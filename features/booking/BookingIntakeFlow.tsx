"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check } from "lucide-react";
import { BookingSlotStep } from "@/features/booking/components/BookingSlotStep";
import { IntakeProgressBar } from "@/features/booking/components/IntakeProgressBar";
import { useAssistant } from "@/features/assistant/AssistantContext";
import { createBooking } from "@/lib/api/client";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { bookingServiceOptions } from "@/lib/config/services";
import { openingHours } from "@/lib/config/hours";
import { BUSINESS } from "@/lib/config";
import { localIsoDate } from "@/lib/date";
import { formatPlate, stripPlate } from "@/lib/format-plate";

type Props = {
  initialRegistration?: string;
  initialService?: string;
  registration?: string;
  onRegistrationChange?: (value: string) => void;
  registrationFromMemory?: boolean;
  onComplete?: () => void;
};

export function BookingIntakeFlow({
  initialRegistration,
  initialService,
  registration: registrationProp,
  onRegistrationChange,
  registrationFromMemory = false,
  onComplete,
}: Props) {
  const { openAssistant } = useAssistant();

  const [service, setService] = useState(
    initialService ?? bookingServiceOptions[0]
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [registration, setRegistration] = useState(initialRegistration ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showRegHint, setShowRegHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDate((prev) => prev || localIsoDate(0));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setShowRegHint(registrationFromMemory);
  }, [mounted, registrationFromMemory]);

  useEffect(() => {
    if (initialRegistration) {
      setRegistration(initialRegistration);
    }
  }, [initialRegistration]);

  useEffect(() => {
    if (registrationProp !== undefined) {
      setRegistration(registrationProp);
    }
  }, [registrationProp]);


  const updateRegistration = useCallback(
    (value: string) => {
      const formatted = formatPlate(value);
      setRegistration(formatted);
      setShowRegHint(false);
      onRegistrationChange?.(formatted);
    },
    [onRegistrationChange]
  );

  const canSubmit = Boolean(
    service &&
      date &&
      time &&
      stripPlate(registration).length >= 2 &&
      customerName.trim() &&
      customerPhone.trim()
  );

  const bookingContext = useMemo(
    () =>
      service && date && time
        ? { service, preferredDate: date, preferredTime: time }
        : null,
    [service, date, time]
  );

  const progressStep = done ? "confirm" : "schedule";

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
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
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        source: "website",
      });
      setDone(true);
      onComplete?.();
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Could not send your request. Please call us."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    service,
    registration,
    date,
    time,
    customerName,
    customerPhone,
    customerEmail,
    notes,
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
          className="flex flex-col items-center py-10 text-center"
        >
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
          <button
            type="button"
            onClick={handleChangeSlot}
            className="mt-6 text-sm font-medium text-cyan hover:underline"
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
        onServiceChange={setService}
        onDateChange={setDate}
        onTimeChange={setTime}
      />

      <div className="mt-6 space-y-4 border-t border-white/8 pt-6">
        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.registrationLabel}
          </label>
          <input
            type="text"
            value={registration}
            onChange={(e) => updateRegistration(e.target.value)}
            onFocus={() => setShowRegHint(false)}
            placeholder="e.g. AB12 CDE"
            className="input-premium w-full rounded-xl px-4 py-3 text-sm uppercase tracking-wider text-white"
            autoComplete="off"
          />
          {showRegHint && (
            <p className="mt-1.5 text-xs text-cyan/80">
              {BOOKING_INTAKE_COPY.registrationRemembered}
            </p>
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
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-zinc-500">
              {BOOKING_INTAKE_COPY.phoneLabel}
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.emailLabel}
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs text-zinc-500">
            {BOOKING_INTAKE_COPY.notesLabel}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input-premium w-full resize-none rounded-xl px-4 py-3 text-sm text-white"
            placeholder="Symptoms, warning lights, or anything we should know"
          />
        </div>

        {submitError && (
          <p className="text-sm text-amber-400/90" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          className="btn-glow w-full rounded-full py-3.5 text-sm font-semibold text-black disabled:opacity-40"
        >
          {submitting
            ? BOOKING_INTAKE_COPY.submittingBooking
            : BOOKING_INTAKE_COPY.submitBooking}
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
