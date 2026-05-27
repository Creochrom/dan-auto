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
const blockers = pids.filter((pid) => {
  const cmd = processCommand(pid);
  return /next" start|next\.js start|next start/i.test(cmd);
});

if (blockers.length === 0) {
  process.exit(0);
}

console.error(
  [
    "",
    `\x1b[33m[dan-auto]\x1b[0m Port ${PORT} is in use by \x1b[1mnext start\x1b[0m (production).`,
    "That is a different build than \x1b[1mnpm run dev\x1b[0m — the homepage can look broken or empty.",
    "",
    "Fix (PowerShell):",
    `  Stop-Process -Id ${blockers.join(",")} -Force`,
    "Then run: npm run dev",
    "",
    `Or open the dev URL shown in the terminal (often http://localhost:3001).`,
    "",
  ].join("\n")
);
process.exit(1);
