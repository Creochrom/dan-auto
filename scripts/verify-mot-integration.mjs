import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const { fetchMotHistoryFromDvsa } = await import("../lib/integrations/dvsa-mot.ts");
const { buildMotHistoryFromApi, buildMotHealthSummary } = await import("../lib/mot/mot-report.ts");

const reg = process.argv[2] || "MV57HJX";
const data = await fetchMotHistoryFromDvsa(reg);
console.log("tests", data?.motTests?.length ?? 0);
if (data?.motTests?.length) {
  const history = buildMotHistoryFromApi(data.motTests);
  console.log("latest", history[0]);
  console.log("summary", buildMotHealthSummary(history));
}
