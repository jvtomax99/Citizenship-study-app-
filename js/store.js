// Everything the app remembers, kept on this phone only (localStorage).
// Step 6's backup file will save and load this same object.

const KEY = 'civics128.v1';

const blank = () => ({
  v: 1,
  place: null,     // 'NJ', 'DC', 'PR'... null until picked
  typed: {},       // per place code: {senators: ['', ''], governor: '', rep: ''}
  list: 'all',     // 'all' (128 questions) or '6520' (the 20 starred ones)
  cards: {},       // per question id: {box, due, seen, last} (js/srs.js)
  spanish: false,  // was the Español line left open
  skippedPlace: false,
  hideInstallTip: false,
});

let state = blank();
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && saved.v === 1) state = { ...state, ...saved };
} catch { /* private mode or damaged data: start fresh, keep working */ }

export const store = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
    return state;
  },
  typedFor(code) {
    const t = state.typed[code] || {};
    return { senators: t.senators || ['', ''], governor: t.governor || '', rep: t.rep || '' };
  },
};
