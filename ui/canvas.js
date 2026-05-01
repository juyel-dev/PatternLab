const canvasPositions = {
  1: [0.16, 0.16], 2: [0.5, 0.16], 3: [0.84, 0.16],
  4: [0.16, 0.5], 5: [0.5, 0.5],  6: [0.84, 0.5],
  7: [0.16, 0.84], 8: [0.5, 0.84], 9: [0.84, 0.84]
};

export function drawLine(fromNode, toNode, canvas) {
  if (!canvas) canvas = document.getElementById('line-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  const [fx, fy] = canvasPositions[fromNode];
  const [tx, ty] = canvasPositions[toNode];

  ctx.beginPath();
  ctx.moveTo(fx * w, fy * h);
  ctx.lineTo(tx * w, ty * h);
  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#00d2ff';
  ctx.shadowBlur = 8;
  ctx.stroke();
}

export function clearCanvas() {
  const canvas = document.getElementById('line-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
