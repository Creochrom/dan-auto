/**
 * Warn before `npm run dev` if port 3000 is held by `next start` (production).
 * Prevents "empty sections" from viewing a stale build while dev runs on 3001.
 */
import { execSync } from "node:child_process";

const PORT = process.env.PORT ?? "3000";

function portOwners(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function processCommand(pid) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return out.trim();
  } catch {
    return "";
  }
}

const pids = portOwners(PORT);
const blockers = pids
  .map((pid) => ({ pid, cmd: processCommand(pid) }))
  .filter(({ cmd }) => /next/i.test(cmd));

if (blockers.length === 0) {
  process.exit(0);
}

const lines = blockers.map(({ pid, cmd }) => {
  const kind = /next" start|next start/i.test(cmd) ? "next start (production)" : "next dev (stale)";
  return `  PID ${pid} — ${kind}`;
});

console.error(
  [
    "",
    `\x1b[33m[dan-auto]\x1b[0m Port ${PORT} is already in use by another Next.js server:`,
    ...lines,
    "",
    "A stale server causes 404 on /api/admin/login and empty homepage sections.",
    "",
    "Fix (PowerShell):",
    `  Stop-Process -Id ${blockers.map((b) => b.pid).join(",")} -Force`,
    "Then run: npm run dev",
    "",
  ].join("\n")
);
process.exit(1);
