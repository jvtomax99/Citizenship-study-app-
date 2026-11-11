// Everything the app remembers, kept on this phone only (localStorage).
// The backup file (js/backup.js) saves and loads this same object.

import { addAnswer } from './progress.js';
import { dayNumber } from './srs.js';

const KEY = 'civics128.v1';
const UNDO = 'civics128.undo'; // what the phone held before the last backup was loaded

export const blank = () => ({
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
  lastBackup: null, // the day number a backup was last saved from this phone
});

let state = blank();
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && saved.v === 1) state = { ...state, ...saved };
} catch { /* private mode or damaged data: start fresh, keep working */ }

// Make next the phone's progress and keep what was saved on the phone until now aside.
// Both are written or neither: if the second write fails, the first is taken back.
function swapIn(next) {
  let before = null, had = null;
  try {
    before = localStorage.getItem(UNDO);
    had = localStorage.getItem(KEY) || JSON.stringify(state); // what is really saved, also if another tab wrote it
    localStorage.setItem(UNDO, had);
    localStorage.setItem(KEY, JSON.stringify(next));
    state = next;
    return true;
  } catch {
    try { if (before === null) localStorage.removeItem(UNDO); else localStorage.setItem(UNDO, before); } catch { /* nothing more to do */ }
    return false;
  }
}

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
  // Load a backup: everything is replaced by next (already checked by unpack in
  // js/backup.js). What the phone held is kept aside (one copy) so it can be put back.
  // False if the phone could not save, and then nothing is changed.
  replace(next) {
    const loaded = { ...blank(), ...next, hideInstallTip: state.hideInstallTip, lastBackup: state.lastBackup };
    return swapIn(loaded);
  },
  // The progress kept aside by the last load or put-back, or null.
  kept() {
    try {
      const old = JSON.parse(localStorage.getItem(UNDO) || 'null');
      return old && old.v === 1 ? { ...blank(), ...old } : null;
    } catch { return null; }
  },
  // Put the kept progress back. What is on the phone now is kept aside in its place,
  // so this can itself be put back.
  undo() {
    const old = this.kept();
    return !!old && swapIn(old);
  },
  typedFor(code) {
    const t = state.typed[code] || {};
    return { senators: t.senators || ['', ''], governor: t.governor || '', rep: t.rep || '' };
  },
};
