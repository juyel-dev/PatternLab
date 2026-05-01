// Node positions: 1..9
// Grid layout:
// 1 2 3
// 4 5 6
// 7 8 9

const SKIP_RULES = {
  '1,3': 2, '1,7': 4, '1,9': 5,
  '2,8': 5,
  '3,1': 2, '3,7': 5, '3,9': 6,
  '4,6': 5,
  '6,4': 5,
  '7,1': 4, '7,3': 5, '7,9': 8,
  '8,2': 5,
  '9,1': 5, '9,3': 6, '9,7': 8
};

export function isValidMove(current, next, visited) {
  if (next < 1 || next > 9) return false;
  if (visited.has(next)) return false;
  const key = `${current},${next}`;
  if (SKIP_RULES[key]) {
    // Must have visited the middle node
    return visited.has(SKIP_RULES[key]);
  }
  return true;
}

export function isValidPattern(pattern) {
  if (pattern.length < 4) return { valid: false, error: 'Pattern must have at least 4 nodes.' };
  const visited = new Set();
  for (let i = 0; i < pattern.length; i++) {
    if (visited.has(pattern[i])) return { valid: false, error: 'Repeated node.' };
    if (i > 0) {
      if (!isValidMove(pattern[i-1], pattern[i], visited)) {
        return { valid: false, error: `Invalid move from ${pattern[i-1]} to ${pattern[i]}.` };
      }
    }
    visited.add(pattern[i]);
  }
  return { valid: true };
}
