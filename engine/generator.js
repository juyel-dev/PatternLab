import { isValidMove } from './validator.js';

// Generator that yields all valid patterns length >=4
export function* allPatterns() {
  const visited = new Set();
  function* dfs(current, path) {
    visited.add(current);
    path.push(current);
    if (path.length >= 4) {
      yield [...path];
    }
    for (let next = 1; next <= 9; next++) {
      if (isValidMove(current, next, visited)) {
        yield* dfs(next, path);
      }
    }
    path.pop();
    visited.delete(current);
  }

  for (let start = 1; start <= 9; start++) {
    yield* dfs(start, []);
  }
}

// Count total (synchronous, might block, use worker for UI)
export function countTotalPatterns() {
  let count = 0;
  for (let _ of allPatterns()) count++;
  return count;
}
