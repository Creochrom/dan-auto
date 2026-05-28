/**
 * Local setup check — prints status only, never secrets.
 * Usage: node scripts/verify-setup.mjs
 * Loads .env.local via dotenv if present (manual parse, no dependency).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const env = {};

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

function ok(label, pass, hint = "") {
  const mark = pass ? "OK" : "MISSING";
  console.log(`  [${mark}] ${label}${hint ? ` — ${hint}` : ""}`);
  return pass;
}

console.log("\nDan Auto — local setup check\n");

if (!existsSync(envPath)) {
  console.log("  No .env.local found. Copy .env.example → .env.local\n");
  process.exit(1);
}

const adminUser = env.ADMIN_USERNAME?.trim();
const adminPass = env.ADMIN_PASSWORD?.trim();
const adminHash = env.ADMIN_PASSWORD_HASH?.trim();
const sessionSecret = env.ADMIN_SESSION_SECRET?.trim();
const supabaseUrl = env.SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const storage = (env.STORAGE_BACKEND || "mock").trim().toLowerCase();

let n = 0;
n += ok("ADMIN_USERNAME", !!adminUser) ? 0 : 1;
n += ok("ADMIN_PASSWORD or ADMIN_PASSWORD_HASH", !!(adminPass || adminHash)) ? 0 : 1;
n +=
  ok(
    "ADMIN_SESSION_SECRET (32+ chars)",
    !!sessionSecret && sessionSecret.length >= 32,
    sessionSecret && sessionSecret.length < 32 ? `only ${sessionSecret.length} chars` : ""
  ) ? 0 : 1;

const badPublicUrl = env.NEXT_PUBLIC_SUPABASE_URL?.includes("/rest/v1");
if (badPublicUrl) {
  console.log(
    "  [WARN] NEXT_PUBLIC_SUPABASE_URL should be project root only (no /rest/v1/)"
  );
}

n += ok(
  "SUPABASE_URL (server)",
  !!supabaseUrl && supabaseUrl.startsWith("https://") && !supabaseUrl.includes("/rest"),
  !supabaseUrl ? "use https://<ref>.supabase.co" : ""
) ? 0 : 1;

const serviceKeyReal =
  !!serviceKey &&
  serviceKey !== "your_service_role_key" &&
  serviceKey.length > 40;
n += ok("SUPABASE_SERVICE_ROLE_KEY", serviceKeyReal, "paste from Supabase → Settings → API") ? 0 : 1;

console.log(`  [INFO] STORAGE_BACKEND=${storage || "mock"}`);
if (storage === "supabase" && !serviceKeyReal) {
  console.log("  [WARN] STORAGE_BACKEND=supabase but service role key is not set — DB writes will fail");
}

console.log(n === 0 ? "\n  Ready for: npm run dev → /admin/login\n" : `\n  Fix ${n} item(s) above, then restart npm run dev\n`);
process.exit(n > 0 ? 1 : 0);
