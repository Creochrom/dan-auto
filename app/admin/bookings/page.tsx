"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookingCard } from "@/features/booking/components/BookingCard";
import type { Booking } from "@/lib/types/booking";

/**
 * Booking management — Phase 1 read-only list from mock API.
 * TODO: Auth, filters, status updates, Supabase sync.
 */
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/bookings")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setBookings(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">Website & assistant requests</p>
        </div>
        <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
          ← Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.08] bg-black/40 p-8 text-center text-sm text-zinc-500">
          No bookings yet. Submit via the website booking form or AI assistant.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
