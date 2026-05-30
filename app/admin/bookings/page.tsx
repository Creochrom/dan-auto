"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { formatPlate, stripPlate } from "@/lib/format-plate";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { WorkshopBookingCard } from "@/features/booking/components/WorkshopBookingCard";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types/booking";

/**
 * Booking management — read-only list (admin session + STORAGE_BACKEND).
 * TODO: filters, status updates.
 */
function AdminBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regParam = searchParams.get("reg") ?? "";
  const regCanon = regParam ? stripPlate(regParam) : "";
  const regDisplay = regCanon ? formatPlate(regParam) : "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const r = await adminFetch(`/api/bookings${qs}`, { credentials: "include" });
      if (r.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await r.json().catch(() => null)) as
        | { ok?: boolean; data?: Booking[]; error?: string }
        | null;
      if (!r.ok || !json?.ok) {
        throw new Error(json?.error ?? "Unable to load bookings right now.");
      }
      setBookings(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bookings right now.");
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const visibleBookings = useMemo(() => {
    if (!regCanon) return bookings;
    return bookings.filter((b) => stripPlate(b.registration) === regCanon);
  }, [bookings, regCanon]);

  async function onChangeStatus(id: string, status: BookingStatus) {
    setPendingStatusId(id);
    try {
      const res = await adminFetch("/api/bookings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            data?: { booking?: Booking; job?: { id: string } };
            error?: string;
          }
        | null;
      const updated = json?.data?.booking;
      if (!res.ok || !json?.ok || !updated) {
        throw new Error(json?.error ?? "Could not update booking status.");
      }

      setBookings((prev) =>
        prev.map((booking) => (booking.id === id ? updated : booking))
      );

      if (json.data?.job?.id && status === "confirmed") {
        router.push(`/admin/jobs/${json.data.job.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update booking status.");
    } finally {
      setPendingStatusId(null);
    }
  }

  async function onDeleteBooking(id: string, registration: string) {
    const label = registration.trim() || "this booking";
    if (
      !window.confirm(
        `Delete ${label}? This cannot be undone. Any linked job will stay but lose its booking link.`
      )
    ) {
      return;
    }

    setPendingDeleteId(id);
    setError(null);
    try {
      const res = await adminFetch(`/api/bookings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Could not delete booking.");
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete booking.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <main className="admin-content-wrap pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">Website & assistant requests</p>
        </div>
        <Link href="/admin/today" className="text-sm text-[#d4a63c] hover:underline">
          ← Today
        </Link>
      </div>

      <AdminQuickLinks active="bookings" />

      {regCanon ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d4a63c]/25 bg-[#d4a63c]/5 px-4 py-3">
          <p className="text-sm text-zinc-200">
            Filtered by registration:{" "}
            <span className="font-mono text-[#d4a63c]">{regDisplay}</span>
          </p>
          <Link
            href="/admin/bookings"
            className="text-xs text-zinc-400 hover:text-white hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            Status filter
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
            className="input-premium mt-2 h-10 min-w-44 rounded-xl px-3 text-sm text-white"
          >
            <option value="all">All statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-zinc-500">{visibleBookings.length} shown</p>
      </div>

      {loading ? (
        <div className="premium-card rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-400">Loading booking requests...</p>
        </div>
      ) : error ? (
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-rose-300">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Verify your admin session and retry from this page.
          </p>
          <button
            type="button"
            onClick={() => void loadBookings()}
            className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="premium-card rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-300">
            {regCanon
              ? `No bookings for ${regDisplay}.`
              : statusFilter === "all"
                ? "No booking requests yet."
                : "No bookings in this status."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {regCanon
              ? "Try clearing the registration filter or another status."
              : statusFilter === "all"
                ? "New website and assistant booking requests will be listed here."
                : "Try another status filter to view more workshop jobs."}
          </p>
          {regCanon ? (
            <Link
              href="/admin/bookings"
              className="mt-4 inline-block text-xs text-[#d4a63c] hover:underline"
            >
              Clear registration filter
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBookings.map((b) => (
            <li key={b.id}>
              <WorkshopBookingCard
                booking={b}
                statusChanging={pendingStatusId === b.id}
                deleting={pendingDeleteId === b.id}
                onStatusChange={(status) => void onChangeStatus(b.id, status)}
                onConfirm={() => void onChangeStatus(b.id, "confirmed")}
                onDelete={() => void onDeleteBooking(b.id, b.registration)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-sm text-zinc-400">Loading booking requests...</p>
        </main>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
