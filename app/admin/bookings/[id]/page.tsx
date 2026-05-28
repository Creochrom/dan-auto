"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { BookingCard } from "@/features/booking/components/BookingCard";
import { VehicleHealthSummary } from "@/components/vehicle/VehicleHealthSummary";
import { VehicleIntelligencePanel } from "@/components/vehicle/VehicleIntelligencePanel";
import { useVehicleReport } from "@/hooks/useVehicleReport";
import type { Booking } from "@/lib/types/booking";

type BookingDetailResponse = {
  ok?: boolean;
  data?: { booking?: Booking };
  error?: string;
};

type BookingPatchResponse = {
  ok?: boolean;
  data?: { booking?: Booking; job?: { id: string; created: boolean } | null };
  error?: string;
};

type AiAssistResponse = {
  ok?: boolean;
  data?: {
    frontDeskSummary?: string;
    serviceCategorySuggestion?: {
      suggestedCategory: string;
      reason: string;
    };
  };
  error?: string;
};

type UploadApiResponse = {
  ok?: boolean;
  data?: {
    upload?: {
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    };
  };
  error?: string;
};

function toDateInputValue(isoDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params?.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");

  const [checkInMileage, setCheckInMileage] = useState("");
  const [checkInDamage, setCheckInDamage] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInPhotos, setCheckInPhotos] = useState<
    Array<{
      uploadId?: string;
      fileName: string;
      mimeType?: string;
      sizeBytes?: number;
      storagePath?: string;
    }>
  >([]);

  const [assistLoading, setAssistLoading] = useState(false);
  const [assistSummary, setAssistSummary] = useState("");
  const [assistCategory, setAssistCategory] = useState<{
    suggestedCategory: string;
    reason: string;
  } | null>(null);
  const { report: vehicleReport, loading: vehicleLoading, error: vehicleError } =
    useVehicleReport(booking?.registration);

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/bookings/${bookingId}`, { credentials: "include" });
      if (res.status === 401) {
        router.replace(`/admin/login?from=/admin/bookings/${bookingId}`);
        return;
      }

      const json = (await res.json().catch(() => null)) as BookingDetailResponse | null;
      if (!res.ok || !json?.ok || !json.data?.booking) {
        throw new Error(json?.error ?? "Unable to load booking.");
      }

      const b = json.data.booking;
      setBooking(b);
      setRescheduleDate(toDateInputValue(b.preferredDate));
      setRescheduleTime(b.preferredTime ?? "");
      setRejectionNote("");
      setNotice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load booking.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const patchBooking = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!bookingId) return null;
      setSaving(true);
      setError(null);
      setNotice(null);
      try {
        const res = await adminFetch("/api/bookings", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: bookingId, ...patch }),
        });

        if (res.status === 401) {
          router.replace(`/admin/login?from=/admin/bookings/${bookingId}`);
          return null;
        }

        const json = (await res.json().catch(() => null)) as BookingPatchResponse | null;
        if (!res.ok || !json?.ok || !json.data?.booking) {
          throw new Error(json?.error ?? "Could not update booking.");
        }

        setBooking(json.data.booking);
        return json.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update booking.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [bookingId, router]
  );

  const handleConfirm = useCallback(async () => {
    const data = await patchBooking({ status: "confirmed" });
    if (!data?.booking) return;
    if (data.job?.id) {
      setNotice(
        data.job.created
          ? `Booking confirmed and job created (${data.job.id}).`
          : `Booking confirmed. Existing job linked (${data.job.id}).`
      );
    } else {
      setNotice("Booking confirmed.");
    }
  }, [patchBooking]);

  const handleReschedule = useCallback(async () => {
    if (!rescheduleDate.trim() || !rescheduleTime.trim()) {
      setError("Provide both date and time to reschedule.");
      return;
    }
    const data = await patchBooking({
      status: "rescheduled",
      preferredDate: rescheduleDate.trim(),
      preferredTime: rescheduleTime.trim(),
    });
    if (!data?.booking) return;
    setNotice("Booking marked as rescheduled.");
  }, [patchBooking, rescheduleDate, rescheduleTime]);

  const handleReject = useCallback(async () => {
    const mergedNotes = [booking?.notes?.trim(), rejectionNote.trim()].filter(Boolean).join("\n");
    const data = await patchBooking({
      status: "rejected",
      ...(mergedNotes ? { notes: mergedNotes } : {}),
    });
    if (!data?.booking) return;
    setNotice("Booking rejected.");
  }, [booking?.notes, patchBooking, rejectionNote]);

  const handleGenerateAssist = useCallback(async () => {
    if (!bookingId) return;
    setAssistLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/bookings/${bookingId}/ai-assist`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace(`/admin/login?from=/admin/bookings/${bookingId}`);
        return;
      }
      const json = (await res.json().catch(() => null)) as AiAssistResponse | null;
      if (!res.ok || !json?.ok || !json.data) {
        throw new Error(json?.error ?? "Could not generate AI assist.");
      }
      setAssistSummary(json.data.frontDeskSummary?.trim() ?? "");
      setAssistCategory(json.data.serviceCategorySuggestion ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate AI assist.");
    } finally {
      setAssistLoading(false);
    }
  }, [bookingId, router]);

  const handleUploadCheckInPhotos = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setSaving(true);
      setError(null);
      try {
        const uploaded: Array<{
          uploadId?: string;
          fileName: string;
          mimeType?: string;
          sizeBytes?: number;
          storagePath?: string;
        }> = [];

        for (const file of Array.from(files)) {
          const form = new FormData();
          form.append("file", file);
          const res = await adminFetch("/api/uploads", {
            method: "POST",
            credentials: "include",
            body: form,
          });
          const json = (await res.json().catch(() => null)) as UploadApiResponse | null;
          if (!res.ok || !json?.ok || !json.data?.upload) {
            throw new Error(json?.error ?? `Upload failed for ${file.name}`);
          }
          uploaded.push({
            uploadId: json.data.upload.id,
            fileName: json.data.upload.fileName,
            mimeType: json.data.upload.mimeType,
            sizeBytes: json.data.upload.sizeBytes,
          });
        }

        setCheckInPhotos((prev) => [...prev, ...uploaded]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload check-in photos.");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleCheckIn = useCallback(async () => {
    if (!bookingId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const mileageNum =
        checkInMileage.trim() && Number.isFinite(Number(checkInMileage))
          ? Number(checkInMileage)
          : undefined;
      const res = await adminFetch("/api/jobs/check-in", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          ...(mileageNum !== undefined ? { mileage: mileageNum } : {}),
          ...(checkInDamage.trim() ? { damage: checkInDamage.trim() } : {}),
          ...(checkInNotes.trim() ? { notes: checkInNotes.trim() } : {}),
          ...(checkInPhotos.length ? { photos: checkInPhotos } : {}),
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            data?: { job?: { id: string }; createdFromBooking?: boolean; upgraded?: boolean };
            error?: string;
          }
        | null;
      if (!res.ok || !json?.ok || !json.data?.job?.id) {
        throw new Error(json?.error ?? "Check-in failed.");
      }

      const suffix = json.data.createdFromBooking
        ? " Job was created from booking."
        : json.data.upgraded
          ? " Job status moved to checked in."
          : "";
      setNotice(`Check-in saved and linked to job ${json.data.job.id}.${suffix}`);
      router.push(`/admin/jobs/${json.data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setSaving(false);
    }
  }, [
    bookingId,
    checkInDamage,
    checkInMileage,
    checkInNotes,
    checkInPhotos,
    router,
  ]);

  const assistCategoryLabel = useMemo(
    () => assistCategory?.suggestedCategory ?? "Not generated",
    [assistCategory]
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm text-zinc-500">Loading booking...</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-zinc-300">Booking not found.</p>
          <Link href="/admin/bookings" className="mt-3 inline-block text-sm text-[#d4a63c] hover:underline">
            ← Back to bookings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Booking detail</h1>
          <p className="mt-1 text-sm text-zinc-500">Intake confirmation and check-in</p>
        </div>
        <Link href="/admin/bookings" className="text-sm text-[#d4a63c] hover:underline">
          ← Back to bookings
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4">
          <BookingCard booking={booking} />

          <div className="premium-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Status actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || booking.status === "confirmed"}
                onClick={() => void handleConfirm()}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={saving || booking.status === "rejected"}
                onClick={() => void handleReject()}
                className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Human confirmation required. No automatic status changes are performed.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">
                Reschedule date
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input-premium mt-1 h-10 w-full rounded-xl px-3 text-sm"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Reschedule time
                <input
                  type="text"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  placeholder="e.g. 10:30"
                  className="input-premium mt-1 h-10 w-full rounded-xl px-3 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleReschedule()}
              className="mt-3 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"
            >
              Mark as rescheduled
            </button>

            <label className="mt-4 block text-xs text-zinc-400">
              Rejection note (optional)
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={3}
                className="input-premium mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {vehicleLoading ? (
            <div className="premium-card rounded-2xl p-4">
              <p className="text-xs text-zinc-500">Loading vehicle health summary...</p>
            </div>
          ) : vehicleReport && booking ? (
            <>
              <VehicleHealthSummary report={vehicleReport} />
              <VehicleIntelligencePanel
                report={vehicleReport}
                registration={booking.registration}
                assistantHref={`/admin/workshop-assistant?bookingId=${encodeURIComponent(booking.id)}&reg=${encodeURIComponent(booking.registration)}`}
              />
            </>
          ) : vehicleError ? (
            <div className="premium-card rounded-2xl p-4">
              <p className="text-xs text-zinc-500">Vehicle health summary unavailable</p>
              <p className="mt-2 text-xs text-amber-200/90">{vehicleError}</p>
            </div>
          ) : null}

          <div className="premium-card rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">AI assist (draft only)</p>
              <button
                type="button"
                disabled={assistLoading}
                onClick={() => void handleGenerateAssist()}
                className="rounded-full border border-[#d4a63c]/40 bg-[#d4a63c]/10 px-3 py-1.5 text-xs font-semibold text-[#e8d5a3] disabled:opacity-50"
              >
                {assistLoading ? "Generating..." : "Generate draft"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Suggestions only. Staff decide final category and actions.
            </p>
            <label className="mt-3 block text-xs text-zinc-400">
              Front desk summary
              <textarea
                value={assistSummary}
                onChange={(e) => setAssistSummary(e.target.value)}
                rows={6}
                className="input-premium mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <p className="text-xs text-zinc-500">Suggested service category</p>
              <p className="mt-1 text-sm text-white">{assistCategoryLabel}</p>
              {assistCategory?.reason && (
                <p className="mt-1 text-xs text-zinc-400">{assistCategory.reason}</p>
              )}
            </div>
          </div>

          <div className="premium-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Check-in to job</p>
            <p className="mt-2 text-xs text-zinc-500">
              Adds mileage, damage notes, and photos to the linked job.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">
                Mileage
                <input
                  type="number"
                  min={0}
                  value={checkInMileage}
                  onChange={(e) => setCheckInMileage(e.target.value)}
                  className="input-premium mt-1 h-10 w-full rounded-xl px-3 text-sm"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => void handleUploadCheckInPhotos(e.target.files)}
                  className="mt-1 block w-full text-xs text-zinc-300 file:mr-2 file:rounded-full file:border file:border-white/15 file:bg-black/20 file:px-3 file:py-1 file:text-xs file:text-zinc-200"
                />
              </label>
            </div>

            {checkInPhotos.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                {checkInPhotos.map((photo, idx) => (
                  <li key={`${photo.fileName}-${idx}`}>{photo.fileName}</li>
                ))}
              </ul>
            )}

            <label className="mt-3 block text-xs text-zinc-400">
              Damage notes
              <textarea
                value={checkInDamage}
                onChange={(e) => setCheckInDamage(e.target.value)}
                rows={3}
                className="input-premium mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-400">
              Additional check-in notes
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                rows={3}
                className="input-premium mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCheckIn()}
              className="mt-4 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 text-xs font-semibold text-cyan disabled:opacity-50"
            >
              Save check-in and open job
            </button>
          </div>
        </section>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
    </main>
  );
}
