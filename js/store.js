// Everything the app remembers, kept on this phone only (localStorage).
// Step 6's backup file will save and load this same object.

import { addAnswer } from './progress.js';
import { dayNumber } from './srs.js';

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
  mock: null,      // the mock interview in progress (js/mock.js)
  mockHistory: [], // the last 10 finished interviews: {day, list, right, wrong, passed}
  goal: 10,        // questions a day: 5, 10 or 20
  days: {},        // per day number: {n: questions answered, g: that day's goal}; today also ids (js/progress.js)
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
  // One more question answered today (the drill and the mock interview call this).
  // Each question counts once a day.
  countAnswer(id) { return this.set({ days: addAnswer(state.days, dayNumber(), state.goal, id) }); },
  // A new daily goal. Today is held to the new goal; earlier days keep theirs.
  setGoal(goal) {
    const today = dayNumber();
    const days = state.days[today] ? { ...state.days, [today]: { ...state.days[today], g: goal } } : state.days;
    return this.set({ goal, days });
  },
  typedFor(code) {
    const t = state.typed[code] || {};
    return { senators: t.senators || ['', ''], governor: t.governor || '', rep: t.rep || '' };
  },
};
