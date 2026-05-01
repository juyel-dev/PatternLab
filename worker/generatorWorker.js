// Web Worker that generates all patterns on demand
import { isValidMove } from '../engine/validator.js'; // Can't use import in worker directly without module. We'll embed validation inline.

// Inline validation (same logic)
const SKIP_RULES = {
  '1,3': 2, '1,7': 4, '1,9': 5, '2,8': 5, '3,1': 2, '3,7': 5, '3,9': 6,
  '4,6': 5, '6,4': 5, '7,1': 4, '7,3': 5, '7,9': 8, '8,2': 5, '9,1': 5, '9,3': 6, '9,7': 8
};
function isValid(a, b, visited) {
  if (b < 1 || b > 9 || visited.has(b)) return false;
  const key = `${a},${b}`;
  if (SKIP_RULES[key]) return visited.has(SKIP_RULES[key]);
  return true;
}

let allPatterns = null; // will be cached after generation
let total = 0;

function generateAll() {
  const patterns = [];
  const visited = new Set();
  function dfs(current, path) {
    visited.add(current);
    path.push(current);
    if (path.length >= 4) patterns.push([...path]);
    for (let next = 1; next <= 9; next++) {
      if (isValid(current, next, visited)) {
        dfs(next, path);
      }
    }
    path.pop();
    visited.delete(current);
  }

  for (let start = 1; start <= 9; start++) {
    dfs(start, []);
    // send progress
    self.postMessage({ type: 'progress', percent: Math.round((start/9)*100) });
  }
  allPatterns = patterns;
  total = patterns.length;
  self.postMessage({ type: 'generationComplete', total });
}

self.onmessage = function(e) {
  const msg = e.data;
  if (msg.type === 'generateAll') {
    if (!allPatterns) generateAll();
    else self.postMessage({ type: 'generationComplete', total });
  } else if (msg.type === 'getPage') {
    if (allPatterns) {
      const { start, count } = msg;
      const page = allPatterns.slice(start, start + count);
      self.postMessage({ type: 'page', patterns: page, start, total });
    }
  } else if (msg.type === 'computeHeatmap') {
    if (allPatterns) {
      const freq = new Array(10).fill(0);
      for (const p of allPatterns) {
        for (const n of p) freq[n]++;
      }
      self.postMessage({ type: 'heatmapData', freq });
    }
  }
};
