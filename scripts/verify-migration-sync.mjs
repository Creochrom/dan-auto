import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

const revenueCols = [
  "estimated_value_pence",
  "approved_quote_pence",
  "final_invoice_pence",
];

let failed = 0;

for (const col of revenueCols) {
  const { error } = await sb.from("jobs").select(col).limit(1);
  const ok = !error;
  console.log(`jobs.${col}:`, ok ? "OK" : `FAIL — ${error.message}`);
  if (!ok) failed += 1;
}

const { error: bceErr } = await sb
  .from("booking_change_events")
  .select("id")
  .limit(1);
console.log(
  "booking_change_events:",
  bceErr ? `FAIL — ${bceErr.message}` : "OK"
);
if (bceErr) failed += 1;

process.exit(failed > 0 ? 1 : 0);
