import type { LeadCompletionValidation } from "@/lib/services/advisor-workflow";
import type { CompleteBookingIntakeInput } from "@/lib/types/service-intake";

export type BookingTraceStage =
  | "1_user_action"
  | "2_readiness_validation"
  | "3_submitBookingHandoff"
  | "4_post_booking_intake"
  | "5_booking_intake_route"
  | "6_booking_intake_service"
  | "7_database_insert"
  | "8_email_send"
  | "9_api_response"
  | "10_client_success_banner";

export type BookingTraceOutcome = "success" | "failure" | "blocked" | "in_progress";

export function createBookingTraceId(): string {
  return `btrace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emit(label: string, payload: Record<string, unknown>): void {
  console.info(label, JSON.stringify(payload, null, 0));
}

export function bookingTraceStart(
  traceId: string,
  meta: Record<string, unknown> = {}
): void {
  emit("BOOKING_TRACE_START", {
    traceId,
    at: new Date().toISOString(),
    ...meta,
  });
}

export function bookingTraceStage(
  stage: BookingTraceStage,
  traceId: string,
  data: Record<string, unknown> = {}
): void {
  emit("BOOKING_TRACE", {
    traceId,
    stage,
    at: new Date().toISOString(),
    ...data,
  });
}

export function bookingTraceEnd(
  traceId: string,
  outcome: BookingTraceOutcome,
  data: Record<string, unknown> = {}
): void {
  emit("BOOKING_TRACE_END", {
    traceId,
    outcome,
    at: new Date().toISOString(),
    ...metaSummary(data),
  });
}

function metaSummary(data: Record<string, unknown>): Record<string, unknown> {
  return data;
}

export function traceValidationResult(
  validation: LeadCompletionValidation
): Record<string, boolean> {
  return {
    customerName: validation.customerName,
    phone: validation.phone,
    vehicle: validation.vehicle,
    issue: validation.issue,
    day: validation.day,
    time: validation.time,
    canSubmit: validation.canSubmit,
  };
}

export function tracePayloadSummary(
  payload: CompleteBookingIntakeInput | null
): Record<string, unknown> | null {
  if (!payload) return null;
  return {
    chatSessionId: payload.chatSessionId,
    service: payload.service,
    preferredDate: payload.preferredDate,
    preferredTime: payload.preferredTime,
    registration: payload.registration,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    uploadCount: payload.uploadIds?.length ?? 0,
  };
}
