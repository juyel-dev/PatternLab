import { resetGrid, getCurrentPattern } from './ui/grid.js';
import { isValidPattern } from './engine/validator.js';
import { getStrengthScore, getStrengthLabel, explain } from './engine/strength.js';

// UI Elements
const infoPattern = document.getElementById('pattern-display');
const infoStrength = document.getElementById('strength-display');
const explanationList = document.getElementById('explanation-list');
const explorePanel = document.getElementById('explore-panel');
const comparePanel = document.getElementById('compare-panel');
const challengePanel = document.getElementById('challenge-panel');
const exploreList = document.getElementById('explore-list');
const loadMoreBtn = document.getElementById('load-more');
const timerSpan = document.getElementById('timer');
const challengeScore = document.getElementById('challenge-score');
const exploreProgress = document.getElementById('explore-progress');

let worker = null;
let explorePage = 0;
const BATCH = 50;
let totalPatterns = 0;
let challengeTimer = null;

// --- Router (Deep Linking) ---
function updateHash(newHash) {
  if (location.hash !== newHash) {
    history.pushState(null, '', newHash);
  }
}

function handleRoute() {
  const hash = location.hash.slice(2) || '/'; // remove '#/'
  const [view, qs] = hash.split('?');
  const params = new URLSearchParams(qs || '');
  hideAllPanels();

  switch (view) {
    case 'pattern':
      loadPatternFromParams(params);
      break;
    case 'explore':
      openExploreMode(params);
      break;
    case 'heatmap':
      showHeatmap();
      break;
    case 'compare':
      showCompare(params);
      break;
    case 'challenge':
      openChallengeMode();
      break;
    default:
      resetAll();
  }
}

function hideAllPanels() {
  explorePanel.style.display = 'none';
  comparePanel.style.display = 'none';
  challengePanel.style.display = 'none';
  document.getElementById('info-panel').style.display = '';
}

function loadPatternFromParams(params) {
  const pStr = params.get('p') || '';
  if (!pStr) return;
  const pattern = pStr.split(',').map(Number);
  const { valid, error } = isValidPattern(pattern);
  if (!valid) {
    document.getElementById('status-msg').textContent = 'Invalid shared pattern: ' + error;
    return;
  }
  // Draw pattern
  resetGrid();
  // Manually simulate drawing
  const visited = new Set();
  for (let i = 0; i < pattern.length; i++) {
    const node = pattern[i];
    visited.add(node);
    document.querySelector(`.dot[data-node="${node}"]`)?.classList.add('active');
    if (i > 0) {
      import('./ui/canvas.js').then(m => m.drawLine(pattern[i-1], node));
    }
  }
  updateInfoPanel(pattern);
  updateHash(`#/pattern?p=${pStr}`);
}

function updateInfoPanel(pattern) {
  const pStr = pattern.join(',');
  infoPattern.textContent = `Pattern: ${pStr}`;
  const score = getStrengthScore(pattern);
  const label = getStrengthLabel(score);
  infoStrength.textContent = `Strength: ${label} (${score}/10)`;
  explanationList.innerHTML = explain(pattern, score).map(r => `<li>${r}</li>`).join('');
}

function resetAll() {
  resetGrid();
  infoPattern.textContent = 'Draw a pattern';
  infoStrength.textContent = '';
  explanationList.innerHTML = '';
  updateHash('/');
}

// --- Worker communication ---
function initWorker() {
  if (!worker) {
    worker = new Worker('worker/generatorWorker.js');
    worker.onmessage = handleWorkerMessage;
  }
}

function handleWorkerMessage(e) {
  const msg = e.data;
  if (msg.type === 'progress') {
    exploreProgress.textContent = `Generating... ${msg.percent}%`;
  } else if (msg.type === 'generationComplete') {
    totalPatterns = msg.total;
    exploreProgress.textContent = `Total patterns: ${totalPatterns}`;
    loadExplorePage(0);
  } else if (msg.type === 'page') {
    renderExplorePage(msg.patterns, msg.start);
  } else if (msg.type === 'heatmapData') {
    renderHeatmap(msg.freq);
  }
}

// --- Explore Mode ---
function openExploreMode(params) {
  hideAllPanels();
  explorePanel.style.display = '';
  exploreList.innerHTML = '';
  exploreProgress.textContent = 'Starting generator...';
  initWorker();
  worker.postMessage({ type: 'generateAll' });
  // No need for seed in this simple version
  updateHash('#/explore');
}

function loadExplorePage(page) {
  worker.postMessage({ type: 'getPage', start: page * BATCH, count: BATCH });
}

function renderExplorePage(patterns, start) {
  patterns.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'pattern-item';
    div.innerHTML = `<span>${p.join(',')}</span><span>${getStrengthLabel(getStrengthScore(p))}</span>`;
    div.addEventListener('click', () => {
      loadPatternFromParams(new URLSearchParams(`p=${p.join(',')}`));
      hideAllPanels();
      document.getElementById('info-panel').style.display = '';
    });
    exploreList.appendChild(div);
  });
  if (start + patterns.length < totalPatterns) {
    loadMoreBtn.style.display = '';
    loadMoreBtn.onclick = () => {
      explorePage++;
      loadExplorePage(explorePage);
    };
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

// --- Heatmap ---
function showHeatmap() {
  hideAllPanels();
  initWorker();
  worker.postMessage({ type: 'computeHeatmap' });
  updateHash('#/heatmap');
}

function renderHeatmap(freq) {
  const dots = document.querySelectorAll('.dot');
  const max = Math.max(...freq.slice(1));
  dots.forEach(dot => {
    const node = Number(dot.dataset.node);
    const opacity = freq[node] / max;
    dot.style.backgroundColor = `rgba(255, 100, 100, ${opacity * 0.9})`;
  });
  // also show info
  document.getElementById('info-panel').style.display = '';
  infoPattern.textContent = 'Heatmap active (reset to clear)';
}

// --- Compare ---
function showCompare(params) {
  hideAllPanels();
  comparePanel.style.display = '';
  const weak = params.get('weak')?.split(',').map(Number) || [];
  const strong = params.get('strong')?.split(',').map(Number) || [];
  document.getElementById('compare-container').innerHTML = `
    <div class="compare-card"><h4>Weak</h4><p>${weak.join(',') || 'none'}</p></div>
    <div class="compare-card"><h4>Strong</h4><p>${strong.join(',') || 'none'}</p></div>
  `;
  updateHash(`#/compare?weak=${weak.join(',')}&strong=${strong.join(',')}`);
}

// --- Challenge ---
let challengeTimeLeft;
function openChallengeMode() {
  hideAllPanels();
  challengePanel.style.display = '';
  challengeScore.style.display = 'none';
  timerSpan.textContent = '20';
  updateHash('#/challenge');
}

document.getElementById('challenge-start').addEventListener('click', () => {
  resetGrid();
  challengeTimeLeft = 20;
  timerSpan.textContent = challengeTimeLeft;
  challengeScore.style.display = 'none';
  clearInterval(challengeTimer);
  challengeTimer = setInterval(() => {
    challengeTimeLeft--;
    timerSpan.textContent = challengeTimeLeft;
    if (challengeTimeLeft <= 0) {
      clearInterval(challengeTimer);
      endChallenge();
    }
  }, 1000);
});

function endChallenge() {
  const pattern = getCurrentPattern();
  const score = getStrengthScore(pattern);
  const label = getStrengthLabel(score);
  challengeScore.style.display = '';
  challengeScore.innerHTML = `Your pattern: ${pattern.join(',')}<br>Strength: ${label} (${score}/10)`;
}

// --- Event Listeners ---
document.getElementById('btn-generate').addEventListener('click', () => {
  // Generate random strong pattern (simple heuristic)
  const generateStrong = () => {
    // Get one from worker? simpler: use algorithm to pick random walk that ensures score >=7
    // Quick mock: use a set of known strong patterns
    const strongPatterns = [
      [1,6,8,3,5,7,2,9], [7,2,9,4,1,8,3,6], [5,1,9,4,6,2,8,3],
      [2,7,9,5,1,8,3,6], [3,8,1,6,5,9,2,7]
    ];
    const pick = strongPatterns[Math.floor(Math.random() * strongPatterns.length)];
    return pick;
  };
  const pattern = generateStrong();
  loadPatternFromParams(new URLSearchParams(`p=${pattern.join(',')}`));
});

document.getElementById('btn-strength').addEventListener('click', () => {
  const pattern = getCurrentPattern();
  if (pattern.length < 4) {
    document.getElementById('status-msg').textContent = 'Draw a complete pattern first.';
    return;
  }
  updateInfoPanel(pattern);
});

document.getElementById('btn-reset').addEventListener('click', resetAll);

document.getElementById('btn-explore').addEventListener('click', () => openExploreMode(new URLSearchParams()));

document.getElementById('btn-heatmap').addEventListener('click', showHeatmap);

document.getElementById('btn-compare').addEventListener('click', () => {
  const weak = prompt('Enter weak pattern (comma-separated):')?.replace(/\s/g,'') || '';
  const strong = prompt('Enter strong pattern:')?.replace(/\s/g,'') || '';
  showCompare(new URLSearchParams(`weak=${weak}&strong=${strong}`));
});

document.getElementById('btn-challenge').addEventListener('click', openChallengeMode);

document.getElementById('btn-share').addEventListener('click', () => {
  const pattern = getCurrentPattern();
  if (pattern.length < 4) return;
  const url = `${location.origin}${location.pathname}#/pattern?p=${pattern.join(',')}`;
  navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
});

// Listen to pattern updates from grid
import('./ui/grid.js').then(mod => {
  mod.onPatternUpdate((pattern) => {
    // optional live update
  });
});

// Initial route
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => {
  handleRoute();
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});
