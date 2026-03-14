/** Shared chart helpers — extracted from AutoresearchPage + ModelSummaryCard */

/** Find index of minimum y value in a data array */
export function findBestIndex(data: { y: number }[]): number {
  if (!data.length) return -1;
  let minVal = Infinity;
  let minIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].y < minVal) {
      minVal = data[i].y;
      minIdx = i;
    }
  }
  return minIdx;
}
