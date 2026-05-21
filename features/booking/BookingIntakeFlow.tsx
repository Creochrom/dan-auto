"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BookingIntakeModal } from "@/features/booking/components/BookingIntakeModal";
import { BookingSlotStep } from "@/features/booking/components/BookingSlotStep";
import { IntakeProgressBar } from "@/features/booking/components/IntakeProgressBar";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { bookingServiceOptions } from "@/lib/config/services";
import { openingHours } from "@/lib/config/hours";
import { BUSINESS } from "@/lib/config";

type Props = {
  initialRegistration?: string;
  initialService?: string;
  onComplete?: () => void;
};

export function BookingIntakeFlow({
  initialRegistration,
  initialService,
  onComplete,
}: Props) {
  const [service, setService] = useState(
    initialService ?? bookingServiceOptions[0]
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [done, setDone] = useState(false);

  const canContinue = Boolean(service && date && time);

  const bookingContext = useMemo(
    () =>
      canContinue
        ? { service, preferredDate: date, preferredTime: time }
        : null,
    [service, date, time, canContinue]
  );

  const progressStep = done ? "confirm" : modalOpen ? "intake" : "schedule";

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    setModalOpen(true);
  }, [canContinue]);

  const handleSubmitted = useCallback(() => {
    setModalOpen(false);
    setDone(true);
    onComplete?.();
  }, [onComplete]);

  const handleChangeSlot = useCallback(() => {
    setModalOpen(false);
    setDone(false);
  }, []);

  return (
    <>
      <IntakeProgressBar current={progressStep} />

      {done ? (
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
            {initialRegistration ? ` · ${initialRegistration}` : ""}
          </p>
          <button
            type="button"
            onClick={handleChangeSlot}
            className="mt-6 text-sm font-medium text-cyan hover:underline"
          >
            {BOOKING_INTAKE_COPY.changeSlot}
          </button>
        </motion.div>
      ) : (
        <BookingSlotStep
          service={service}
          date={date}
          time={time}
          onServiceChange={setService}
          onDateChange={setDate}
          onTimeChange={setTime}
          onContinue={handleContinue}
          canContinue={canContinue}
        />
      )}

      {bookingContext && (
        <BookingIntakeModal
          open={modalOpen}
          bookingContext={bookingContext}
          registrationHint={initialRegistration}
          onClose={() => setModalOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}
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
          "AI-assisted symptom intake with photo/video upload",
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
