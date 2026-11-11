// The backup file: everything the phone remembers, as one small text file.
// Pure functions, no browser needed (tests/backup.test.mjs).
//
// A file made on another phone is not trusted: unpack() copies out only the fields this
// app knows, checks each one, and drops the rest. It never keeps the parsed object itself.
import { isKnown } from './srs.js';
import { GOALS, streak } from './progress.js';

export const APP = 'civics128';
export const VERSION = 1;
export const MAX_BYTES = 1000000; // a real backup is a few thousand characters
const QUESTIONS = 128;
const NAME_LENGTH = 80;
const SAID_LENGTH = 300;

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const int = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const DAY = (x) => int(x, 0, 200000); // a day number (js/srs.js); 200000 is past the year 2500
const qid = (x) => int(x, 1, QUESTIONS);
const str = (x, max) => (typeof x === 'string' ? x.slice(0, max) : '');
const LISTS = ['all', '6520'];
const VERDICTS = ['right', 'wrong'];
const AUTOS = ['right', 'wrong', 'unsure', 'skip'];

const two = (n) => String(n).padStart(2, '0');
export const isoDay = (date = new Date()) => `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
export const fileName = (date = new Date()) => `citizenship-backup-${isoDay(date)}.json`;

// The text of a backup file. What belongs to this phone and not to the person stays
// out: the hidden install tip and the date of the last backup.
export function pack(state, date = new Date()) {
  const { hideInstallTip, lastBackup, ...keep } = state;
  return JSON.stringify({ app: APP, v: VERSION, saved: isoDay(date), state: keep });
}

function cleanTyped(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const code of Object.keys(raw).slice(0, 60)) {
    const t = raw[code];
    if (!/^[A-Z]{2}$/.test(code) || !isObj(t)) continue;
    const sen = Array.isArray(t.senators) ? t.senators : [];
    out[code] = { senators: [str(sen[0], NAME_LENGTH), str(sen[1], NAME_LENGTH)], governor: str(t.governor, NAME_LENGTH), rep: str(t.rep, NAME_LENGTH) };
  }
  return out;
}

function cleanCards(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (let id = 1; id <= QUESTIONS; id++) {
    const c = raw[id];
    if (!isObj(c) || !int(c.box, 0, 5) || !DAY(c.due) || !int(c.seen, 0, 1000000)) continue;
    out[id] = { box: c.box, due: c.due, seen: c.seen };
    if (typeof c.last === 'string') out[id].last = c.last === 'knew' ? 'knew' : c.last === 'guessed' ? 'guessed' : 'missed';
  }
  return out;
}

function cleanDays(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const d of Object.keys(raw).slice(0, 500)) {
    const v = raw[d];
    if (!/^\d{1,6}$/.test(d) || !isObj(v) || !int(v.n, 0, 100000) || !int(v.g, 1, 1000)) continue;
    out[Number(d)] = { n: v.n, g: v.g };
    if (Array.isArray(v.ids)) out[Number(d)].ids = [...new Set(v.ids.filter(qid))];
  }
  return out;
}

// One answer of an interview: {said, auto, verdict}. verdict may be null while it is open.
function cleanAnswer(e, { open = false } = {}) {
  if (!isObj(e)) return null;
  const verdict = VERDICTS.includes(e.verdict) ? e.verdict : null;
  if (!verdict && !open) return null;
  return { said: str(e.said, SAID_LENGTH), auto: AUTOS.includes(e.auto) ? e.auto : 'unsure', verdict };
}

// The interview in progress. Anything odd in it and the interview is left behind:
// the rest of the backup still loads.
function cleanMock(m) {
  if (!isObj(m) || !LISTS.includes(m.list) || !Array.isArray(m.ids) || !Array.isArray(m.log)) return null;
  const ids = m.ids.filter(qid);
  if (!ids.length || ids.length !== m.ids.length || ids.length > 20 || new Set(ids).size !== ids.length) return null;
  if (m.log.length > ids.length) return null;
  const log = [];
  for (let i = 0; i < m.log.length; i++) {
    const e = cleanAnswer(m.log[i]);
    if (!e || m.log[i].id !== ids[i]) return null;
    log.push({ id: ids[i], ...e, flipped: m.log[i].flipped === true });
  }
  const open = m.open == null || log.length >= ids.length ? null : cleanAnswer(m.open, { open: true });
  return { list: m.list, ids, log, open };
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((h) => isObj(h) && DAY(h.day) && LISTS.includes(h.list) && int(h.right, 0, 20) && int(h.wrong, 0, 20))
    .slice(-10).map((h) => ({ day: h.day, list: h.list, right: h.right, wrong: h.wrong, passed: h.passed === true }));
}

// Read a backup. Returns {state, saved} or {error}: 'damaged' (not readable),
// 'other' (not a backup of this app), 'newer' (made by a later version of the app).
export function unpack(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_BYTES) return { error: 'damaged' };
  let raw;
  try { raw = JSON.parse(text); } catch { return { error: 'damaged' }; }
  if (!isObj(raw) || raw.app !== APP || !isObj(raw.state)) return { error: 'other' };
  if (!int(raw.v, 1, 1000000)) return { error: 'other' };
  if (raw.v > VERSION) return { error: 'newer' };
  const s = raw.state;
  const state = {
    v: 1,
    place: typeof s.place === 'string' && /^[A-Z]{2}$/.test(s.place) ? s.place : null,
    typed: cleanTyped(s.typed),
    list: LISTS.includes(s.list) ? s.list : 'all',
    cards: cleanCards(s.cards),
    spanish: s.spanish === true,
    skippedPlace: s.skippedPlace === true,
    mock: cleanMock(s.mock),
    mockHistory: cleanHistory(s.mockHistory),
    goal: GOALS.includes(s.goal) ? s.goal : 10,
    days: cleanDays(s.days),
  };
  return { state, saved: typeof raw.saved === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.saved) ? raw.saved : null };
}

// What a set of progress holds, in numbers a person can compare. ids = the question
// ids to count (all 128).
export function summary(state, ids, today) {
  const cards = state.cards || {};
  return {
    known: ids.filter((id) => isKnown(cards[id])).length,
    total: ids.length,
    seen: ids.filter((id) => cards[id] && cards[id].seen).length,
    streak: streak(state.days || {}, today).count,
    interviews: (state.mockHistory || []).length,
    place: state.place || null,
  };
}

// "today", "yesterday", "12 days ago", "never"
export function ago(day, today) {
  if (!Number.isInteger(day)) return 'never';
  const n = today - day;
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
}
