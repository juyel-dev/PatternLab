import { isValidMove, isValidPattern } from '../engine/validator.js';
import { drawLine, clearCanvas } from './canvas.js';

let currentPattern = [];
let visited = new Set();
let isDrawing = false;
let lastNode = 0;

const gridEl = document.getElementById('dot-grid');
const canvas = document.getElementById('line-canvas');
const statusMsg = document.getElementById('status-msg');

// Create dots
for (let i = 1; i <= 9; i++) {
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.dataset.node = i;
  dot.textContent = i;
  gridEl.appendChild(dot);
}

function resetGridUI() {
  currentPattern = [];
  visited.clear();
  lastNode = 0;
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
  clearCanvas();
  statusMsg.textContent = '';
}

export function resetPattern() {
  resetGridUI();
  return currentPattern;
}

function highlightNode(node) {
  document.querySelector(`.dot[data-node="${node}"]`)?.classList.add('active');
}

export function getCurrentPattern() {
  return [...currentPattern];
}

export function onPatternUpdate(callback) {
  window._patternUpdateCallback = callback;
}

function handleStart(node) {
  resetGridUI();
  visited.add(node);
  currentPattern.push(node);
  lastNode = node;
  highlightNode(node);
  statusMsg.textContent = '';
  if (window._patternUpdateCallback) window._patternUpdateCallback([...currentPattern]);
}

function handleMove(nextNode) {
  if (!visited.has(nextNode) && isValidMove(lastNode, nextNode, visited)) {
    visited.add(nextNode);
    currentPattern.push(nextNode);
    highlightNode(nextNode);
    drawLine(lastNode, nextNode, canvas);
    lastNode = nextNode;
    if (window._patternUpdateCallback) window._patternUpdateCallback([...currentPattern]);
    return true;
  }
  return false;
}

function handleEnd() {
  const validation = isValidPattern(currentPattern);
  if (!validation.valid) {
    statusMsg.textContent = validation.error;
  } else {
    statusMsg.textContent = '';
    if (window._patternUpdateCallback) window._patternUpdateCallback([...currentPattern]);
  }
}

// Touch events
gridEl.addEventListener('touchstart', e => {
  e.preventDefault();
  const dot = e.target.closest('.dot');
  if (dot) {
    handleStart(Number(dot.dataset.node));
    isDrawing = true;
  }
});

gridEl.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!isDrawing) return;
  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);
  const dot = elem?.closest('.dot');
  if (dot) {
    handleMove(Number(dot.dataset.node));
  }
});

gridEl.addEventListener('touchend', e => {
  e.preventDefault();
  isDrawing = false;
  handleEnd();
});

// Mouse events
gridEl.addEventListener('mousedown', e => {
  const dot = e.target.closest('.dot');
  if (dot) {
    handleStart(Number(dot.dataset.node));
    isDrawing = true;
  }
});

gridEl.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const elem = document.elementFromPoint(e.clientX, e.clientY);
  const dot = elem?.closest('.dot');
  if (dot) {
    handleMove(Number(dot.dataset.node));
  }
});

document.addEventListener('mouseup', () => {
  if (isDrawing) {
    isDrawing = false;
    handleEnd();
  }
});

export { resetPattern as resetGrid };
