export function computeHeatmapFrequencies(patterns) {
  const freq = new Array(10).fill(0); // index 1..9
  for (const p of patterns) {
    for (const node of p) {
      freq[node]++;
    }
  }
  return freq;
}
