"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Check } from "lucide-react";
import { timeSlots } from "@/lib/landing-data";
import { SectionHeading } from "./SectionHeading";
import { UKPlateInput } from "./UKPlateInput";

export function Booking() {
  const [reg, setReg] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg || !date || !slot) return;
    setSubmitted(true);
  };

  return (
    <section id="booking" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Booking"
            title="Reserve your bay in under 60 seconds."
            description="Choose a slot that fits your day. We'll confirm by SMS and send a digital check-in link before you arrive."
          />

          <motion.form
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-8"
          >
            {submitted ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-12 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-medium text-white">
                  Booking request received
                </h3>
                <p className="mt-2 max-w-sm text-sm text-zinc-400">
                  We&apos;ll confirm {reg} for {date} at {slot}. Check your phone
                  for our SMS shortly.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2 text-cyan">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">
                    Schedule
                  </span>
                </div>

                <label className="mb-2 mt-4 block text-xs text-zinc-500">
                  Registration
                </label>
                <UKPlateInput value={reg} onChange={setReg} />

                <label className="mb-2 mt-5 block text-xs text-zinc-500">
                  Preferred date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-cyan/50 focus:outline-none"
                />

                <label className="mb-3 mt-5 block text-xs text-zinc-500">
                  Time slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlot(t)}
                      className={`rounded-xl border py-2.5 text-sm transition ${
                        slot === t
                          ? "border-cyan bg-cyan/10 text-cyan"
                          : "border-white/10 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full rounded-full bg-white py-3.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Confirm booking
                </button>
              </>
            )}
          </motion.form>
        </div>
        </div>
    </section>
  );
}
