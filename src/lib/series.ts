/** Clamp a number into the inclusive [lo, hi] range. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Deterministic pseudo-random series generator — same seed yields the same
 * curve, so charts stay stable across renders until live data shifts them.
 */
export function series(seed: number, n: number, base: number, amp: number, drift = 0): number[] {
  let s = seed;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const v = base + Math.sin(i / 3.1 + seed) * amp * 0.5 + (r - 0.5) * amp + drift * i;
    out.push(Math.max(0, +v.toFixed(1)));
  }
  return out;
}
