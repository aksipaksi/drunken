// State
let state = {
  profile: null,
  sessionStart: null,
  totalDrinks: 0,
  autoDetections: 0,
  manualPresses: 0,
  ocrRunning: false,
  events: [],
};

// Drink presets
const PRESETS = {
  shot:  { volume: 40,  abv: 40 },
  beer:  { volume: 330, abv: 5 },
  wine:  { volume: 150, abv: 12 },
  custom:{ volume: '',  abv: '' },
};

// BAC calculation (mirrors src/bac.js for renderer)
function calculateBAC() {
  if (state.totalDrinks === 0 || !state.profile) return 0;
  const p = state.profile;
  const hoursElapsed = (Date.now() - state.sessionStart) / (1000 * 60 * 60);
  const r = p.sex === 'male' ? 0.68 : 0.55;
  const alcoholPerDrink = p.drinkVolumeMl * (p.drinkAbv / 100) * 0.789;
  const totalAlcohol = state.totalDrinks * alcoholPerDrink;
  const bac = (totalAlcohol / (p.weightKg * r * 10)) - (0.015 * hoursElapsed);
  return Math.max(0, bac);
}

function getBACStatus(bac) {
  if (bac <= 0) return { label: 'Sober', color: '#888888' };
  if (bac <= 0.05) return { label: 'Buzzed', color: '#4ade80' };
  if (bac <= 0.10) return { label: 'Tipsy', color: '#facc15' };
  if (bac <= 0.20) return { label: 'Drunk', color: '#f97316' };
  return { label: 'Dangerously drunk', color: '#ef4444' };
}

function formatTimeToSober(bac) {
  if (bac <= 0) return 'Sober';
  const hours = bac / 0.015;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `Sober in ~${m}m`;
  return `Sober in ~${h}h ${m}m`;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatEventTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// UI updates
function updateDisplay() {
  const bac = calculateBAC();
  const status = getBACStatus(bac);

  document.getElementById('bac-value').textContent = bac.toFixed(2);
  document.getElementById('bac-value').style.color = status.color;
  document.getElementById('bac-label').textContent = status.label;
  document.getElementById('bac-label').style.color = status.color;
  document.getElementById('sober-time').textContent = formatTimeToSober(bac);

  document.getElementById('total-drinks').textContent = state.totalDrinks;
  document.getElementById('auto-detections').textContent = state.autoDetections;
  document.getElementById('manual-presses').textContent = state.manualPresses;

  if (state.sessionStart) {
    document.getElementById('session-time').textContent = formatTime(Date.now() - state.sessionStart);
  }
}

function addEvent(type, count) {
  const event = { type, count, timestamp: Date.now() };
  state.events.unshift(event);
  if (state.events.length > 20) state.events.pop();
  renderLog();
}

function renderLog() {
  const container = document.getElementById('log-entries');
  if (state.events.length === 0) {
    container.innerHTML = '<div class="log-empty">No events yet. Browse LinkedIn!</div>';
    return;
  }
  container.innerHTML = state.events.map(e => {
    const typeClass = e.type === 'auto' ? 'auto' : 'manual';
    const label = e.type === 'auto' ? `+${e.count} AI detected` : '+1 manual drink';
    return `<div class="log-entry ${typeClass}">
      <span>${label}</span>
      <span class="log-time">${formatEventTime(e.timestamp)}</span>
    </div>`;
  }).join('');
}

function addDrink(type, count = 1) {
  state.totalDrinks += count;
  if (type === 'manual') {
    state.manualPresses += count;
  } else {
    state.autoDetections += count;
  }
  addEvent(type, count);
  updateDisplay();

  // Flash the button
  const btn = document.getElementById('drink-btn');
  btn.classList.remove('flash');
  void btn.offsetWidth; // Trigger reflow
  btn.classList.add('flash');
}

// Setup screen
document.getElementById('drink-type').addEventListener('change', (e) => {
  const preset = PRESETS[e.target.value];
  document.getElementById('drink-volume').value = preset.volume;
  document.getElementById('drink-abv').value = preset.abv;
});

document.getElementById('start-btn').addEventListener('click', () => {
  let weightKg = parseFloat(document.getElementById('weight').value);
  const unit = document.getElementById('weight-unit').value;
  if (unit === 'lbs') weightKg = weightKg * 0.453592;

  const sex = document.querySelector('input[name="sex"]:checked').value;
  const drinkVolumeMl = parseFloat(document.getElementById('drink-volume').value);
  const drinkAbv = parseFloat(document.getElementById('drink-abv').value);

  if (!weightKg || !drinkVolumeMl || !drinkAbv) return;

  state.profile = { weightKg, sex, drinkVolumeMl, drinkAbv };
  state.sessionStart = Date.now();

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  // Start BAC update timer
  setInterval(updateDisplay, 1000);
});

// Manual drink button
document.getElementById('drink-btn').addEventListener('click', () => addDrink('manual'));

// OCR controls
const ocrToggle = document.getElementById('ocr-toggle');
const ocrStatusEl = document.getElementById('ocr-status');
const intervalSlider = document.getElementById('interval-slider');
const intervalLabel = document.getElementById('interval-label');

intervalSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  intervalLabel.textContent = `${val}s`;
  if (state.ocrRunning) {
    window.api.updateOCRInterval(val * 1000);
  }
});

ocrToggle.addEventListener('click', async () => {
  if (state.ocrRunning) {
    await window.api.stopOCR();
    state.ocrRunning = false;
    ocrToggle.textContent = 'Start Auto-OCR';
    ocrStatusEl.textContent = 'OCR: Off';
    ocrStatusEl.classList.remove('active');
  } else {
    const hasHelper = await window.api.checkOCRHelper();
    if (!hasHelper) {
      ocrStatusEl.textContent = 'OCR: Helper not found! Run: npm run build-ocr';
      return;
    }
    const interval = parseInt(intervalSlider.value) * 1000;
    await window.api.startOCR(interval);
    state.ocrRunning = true;
    ocrToggle.textContent = 'Stop Auto-OCR';
    ocrStatusEl.textContent = 'OCR: Scanning...';
    ocrStatusEl.classList.add('active');
  }
});

// OCR results
window.api.onScanResult((data) => {
  if (data.skipped) return;
  if (data.count > 0) {
    addDrink('auto', data.count);
  }
});

window.api.onOCRError((msg) => {
  ocrStatusEl.textContent = `OCR Error: ${msg.substring(0, 40)}`;
});

// Keyboard shortcut from main process
window.api.onManualDrink(() => addDrink('manual'));

// Reset button — go back to setup so user can change drink/profile
document.getElementById('reset-btn').addEventListener('click', async () => {
  if (!confirm('Reset session? All progress will be lost.')) return;

  // Stop OCR if running
  if (state.ocrRunning) {
    await window.api.stopOCR();
    state.ocrRunning = false;
    ocrToggle.textContent = 'Start Auto-OCR';
    ocrStatusEl.textContent = 'OCR: Off';
    ocrStatusEl.classList.remove('active');
  }

  state.totalDrinks = 0;
  state.autoDetections = 0;
  state.manualPresses = 0;
  state.events = [];
  state.sessionStart = null;
  state.profile = null;
  renderLog();
  updateDisplay();

  // Show setup screen
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
});
