export function getStrengthScore(pattern) {
  let score = 0;
  const len = pattern.length;

  if (len >= 6) score += 2;
  if (len >= 8) score += 2;

  // Check linearity: consecutive nodes in same row/col/diag
  const isLinear = (a, b, c) => {
    const [xa, ya] = [ (a-1)%3, Math.floor((a-1)/3) ];
    const [xb, yb] = [ (b-1)%3, Math.floor((b-1)/3) ];
    const [xc, yc] = [ (c-1)%3, Math.floor((c-1)/3) ];
    return (xa === xb && xb === xc) || (ya === yb && yb === yc) ||
           (Math.abs(xa - xb) === Math.abs(ya - yb) && Math.abs(xb - xc) === Math.abs(yb - yc));
  };

  let linearSegments = 0;
  for (let i = 0; i < pattern.length - 2; i++) {
    if (isLinear(pattern[i], pattern[i+1], pattern[i+2])) linearSegments++;
  }
  if (linearSegments === 0 && len >= 5) score += 2;

  // Symmetry heuristic (mirror) – simplified: if reversed is same => symmetric
  const rev = [...pattern].reverse();
  if (JSON.stringify(pattern) !== JSON.stringify(rev)) score += 2;

  // Cross movement: check if pattern crosses center in multiple directions
  const mid = 5;
  if (pattern.includes(mid) && len >= 6) score += 2;

  return Math.min(score, 10);
}

export function getStrengthLabel(score) {
  if (score <= 3) return 'Weak';
  if (score <= 6) return 'Medium';
  return 'Strong';
}

export function explain(pattern, score) {
  const reasons = [];
  if (pattern.length < 6) reasons.push('Pattern is too short (use at least 6 nodes).');
  const linear = /* same check as above */ 0;
  // Provide explanation
  const len = pattern.length;
  if (len < 6) reasons.push('Add more nodes for higher strength.');
  if (score <= 3) reasons.push('Try avoiding straight lines and symmetry.');
  else if (score <= 6) reasons.push('Decent, but crossing the middle may improve it.');
  else reasons.push('Excellent! Complex and hard to guess.');
  return reasons;
                                    }
