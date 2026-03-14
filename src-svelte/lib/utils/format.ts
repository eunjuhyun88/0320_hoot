/** Shared formatting utilities — extracted from EconomicsPage, AutoresearchPage, ModelsPage, ExperimentCard */

/** Format dollar amounts: $1.2M, $12K, $123 */
export function fmtDollar(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(n).toLocaleString();
}

/** Format numbers with K/M suffix: 1.2M, 12K, 123 */
export function fmtK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return Math.round(n).toLocaleString();
}

/** Format integer with locale separators */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Format seconds to human-readable duration: 2h 15m, 3m 42s, 18s */
export function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Format number with k suffix (lowercase): 1.2k, 123 */
export function fmtNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

/** Format seconds to short duration: 3m 42s */
export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}
