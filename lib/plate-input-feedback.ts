let sharedCtx: AudioContext | null = null;
let lastBeepAt = 0;

const BEEP_COOLDOWN_MS = 200;

/** Prime audio after user focuses the plate field (browser gesture policy). */
export function primePlateAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = sharedCtx ?? new Ctx();
    sharedCtx = ctx;
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* noop */
  }
}

/**
 * Premium dashboard warning tick — clear, short, modern (not arcade / alarm).
 * ~150ms, high-mid tone with subtle glass overtone.
 */
export function playPlateInvalidBeep(): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastBeepAt < BEEP_COOLDOWN_MS) return;
  lastBeepAt = now;

  try {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = sharedCtx ?? new Ctx();
    sharedCtx = ctx;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const t0 = ctx.currentTime;
    const duration = 0.15;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.13, t0 + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    master.connect(ctx.destination);

    const tick = ctx.createOscillator();
    tick.type = "sine";
    tick.frequency.setValueAtTime(940, t0);
    tick.frequency.exponentialRampToValueAtTime(720, t0 + 0.055);

    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0.85, t0);
    tick.connect(tickGain);
    tickGain.connect(master);

    const glass = ctx.createOscillator();
    glass.type = "triangle";
    glass.frequency.setValueAtTime(1880, t0);
    glass.frequency.exponentialRampToValueAtTime(1420, t0 + 0.07);

    const glassGain = ctx.createGain();
    glassGain.gain.setValueAtTime(0.22, t0);
    glassGain.gain.exponentialRampToValueAtTime(0.04, t0 + duration);
    glass.connect(glassGain);
    glassGain.connect(master);

    tick.start(t0);
    tick.stop(t0 + duration);
    glass.start(t0);
    glass.stop(t0 + duration);
  } catch {
    /* Audio unavailable — visual feedback still applies */
  }
}
