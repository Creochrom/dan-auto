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
  if (!process.env[key]) process.env[key] = val;
}

async function getToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.MOT_HISTORY_CLIENT_ID,
    client_secret: process.env.MOT_HISTORY_CLIENT_SECRET,
    scope: process.env.MOT_HISTORY_SCOPE || "https://tapi.dvsa.gov.uk/.default",
  });
  const res = await fetch(process.env.MOT_HISTORY_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  console.log("token status", res.status);
  const json = await res.json();
  if (!res.ok) {
    console.log("token error", JSON.stringify(json).slice(0, 500));
    return null;
  }
  return json.access_token;
}

async function main() {
  const reg = process.argv[2] || "MV57HJX";
  const token = await getToken();
  if (!token) return;

  const url = `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${reg}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-Key": process.env.MOT_HISTORY_API_KEY,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  console.log("mot status", res.status);
  const text = await res.text();
  console.log("mot body sample", text.slice(0, 3000));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
