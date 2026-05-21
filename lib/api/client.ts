"use client";

import type { Booking } from "@/lib/types/booking";
import type { ChatRequest, ChatResponse } from "@/lib/types/chat";
import type { CreateBookingInput } from "@/lib/types/booking";
import type { CreateLeadInput, Lead } from "@/lib/types/lead";
import type { CreateUploadResult } from "@/lib/types/upload";
import type {
  CompleteBookingIntakeInput,
  CompleteBookingIntakeResult,
} from "@/lib/types/service-intake";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  const json = (await res.json()) as ApiResult<T>;
  return json;
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await parse<ChatResponse>(res);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parse<Booking>(res);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parse<Lead>(res);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function uploadMediaFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CreateUploadResult> {
  onProgress?.(8);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  onProgress?.(70);
  const json = await parse<CreateUploadResult>(res);
  onProgress?.(100);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function completeBookingIntake(
  input: CompleteBookingIntakeInput
): Promise<CompleteBookingIntakeResult> {
  const res = await fetch("/api/booking-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parse<CompleteBookingIntakeResult>(res);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}
