/**
 * Shared animation utility — eased counter with destroyed guard.
 * Automatically stops RAF chain when `isDestroyed()` returns true.
 */
export function animateCounter(
  from: number,
  to: number,
  duration: number,
  cb: (value: number) => void,
  isDestroyed?: () => boolean,
): void {
  const start = performance.now();

  function tick(now: number) {
    if (isDestroyed?.()) return;
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    cb(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
