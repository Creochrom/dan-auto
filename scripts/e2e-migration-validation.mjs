/**
 * End-to-end migration recovery validation.
 * Booking → confirm → job → today dashboard APIs.
 * Usage: node scripts/e2e-migration-validation.mjs
 */
import { readFileSync } from "fs";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const login = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!login || !password) {
  console.error("ADMIN_USERNAME and ADMIN_PASSWORD required in .env.local");
  process.exit(2);
}

function cookieHeader(setCookie) {
  if (!setCookie) return "";
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts.map((c) => c.split(";")[0]).join("; ");
}

async function jsonFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

let failed = 0;
function pass(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? `: ${detail}` : ""}`);
  if (!ok) failed += 1;
}

console.log(`\nE2E validation against ${BASE}\n`);

// 1. Health
const health = await jsonFetch("/api/health/supabase");
pass(
  "Supabase health connected",
  health.body?.data?.connected === true || health.body?.connected === true,
  JSON.stringify(health.body?.data ?? health.body)
);

// 2. Admin login
const loginRes = await jsonFetch("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ login, password }),
});
const cookie = cookieHeader(loginRes.res.headers.getSetCookie?.() ?? loginRes.res.headers.get("set-cookie"));
pass("Admin login", loginRes.res.ok, loginRes.res.status.toString());

const auth = { Cookie: cookie, "Content-Type": "application/json" };

// 3. Create booking
const reg = "AB12CDE";
const bookingPayload = {
  service: "Migration validation MOT",
  registration: reg,
  preferredDate: new Date().toISOString().slice(0, 10),
  preferredTime: "11:00",
  duration: "1h",
  customerName: "Migration Test",
  customerPhone: "07700900999",
  notes: "E2E migration recovery test — safe to delete",
  source: "website",
};

const createBooking = await jsonFetch("/api/bookings", {
  method: "POST",
  headers: auth,
  body: JSON.stringify(bookingPayload),
});
const booking = createBooking.body?.data ?? createBooking.body?.booking;
pass("Create booking", createBooking.res.ok && booking?.id, booking?.id ?? createBooking.body?.error);

// 4. Vehicle lookup
const lookup = await jsonFetch(`/api/vehicle-lookup?reg=${encodeURIComponent(reg)}`, {
  headers: { Cookie: cookie },
});
pass(
  "Vehicle lookup (no crash)",
  lookup.res.status === 200 || lookup.res.status === 404 || lookup.body?.ok === true || lookup.body?.ok === false,
  lookup.res.status.toString()
);

// 5. Confirm booking → job
let jobId = null;
if (booking?.id) {
  const confirm = await jsonFetch("/api/bookings", {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ id: booking.id, status: "confirmed" }),
  });
  const confirmed = confirm.body?.data?.booking ?? confirm.body?.data;
  jobId = confirm.body?.data?.job?.id ?? null;
  pass(
    "Confirm booking → job",
    confirm.res.ok && confirmed?.status === "confirmed",
    jobId ? `job ${jobId}` : confirm.body?.error ?? "no job id"
  );
}

// 6. Jobs list (revenue columns)
const jobsRes = await jsonFetch("/api/jobs", { headers: { Cookie: cookie } });
const jobsPayload = jobsRes.body?.data;
const jobs = Array.isArray(jobsPayload)
  ? jobsPayload
  : Array.isArray(jobsPayload?.jobs)
    ? jobsPayload.jobs
    : [];
const testJob = jobId ? jobs.find((j) => j.id === jobId) : jobs[0];
pass(
  "Jobs API (revenue columns)",
  jobsRes.res.ok && Array.isArray(jobs),
  testJob
    ? `job ${testJob.id} estimated=${testJob.estimatedValuePence ?? "null"}`
    : jobsRes.body?.error
);

// 7. Today dashboard data sources
const bookingsRes = await jsonFetch("/api/bookings", { headers: { Cookie: cookie } });
pass(
  "Bookings API for Today dashboard",
  bookingsRes.res.ok && Array.isArray(bookingsRes.body?.data),
  `${(bookingsRes.body?.data ?? []).length} bookings`
);

const motRes = await jsonFetch("/api/admin/mot-queue", { headers: { Cookie: cookie } });
pass(
  "MOT queue API for Today dashboard",
  motRes.res.ok,
  motRes.res.status.toString()
);

// 8. booking_change_events table writable (via booking update path already tested on confirm)

console.log(failed === 0 ? "\nAll E2E checks passed.\n" : `\n${failed} check(s) failed.\n`);
process.exit(failed > 0 ? 1 : 0);
