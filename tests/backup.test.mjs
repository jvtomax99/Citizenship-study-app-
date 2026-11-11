import test from 'node:test';
import assert from 'node:assert/strict';
import { pack, unpack, summary, ago, fileName, MAX_BYTES } from '../js/backup.js';

const today = 20768;
const full = { n: 10, g: 10 };
const state = () => ({
  v: 1, place: 'NJ', typed: { NJ: { senators: ['', ''], governor: '', rep: 'Test Representative' } }, list: '6520',
  cards: { 1: { box: 2, due: today + 3, seen: 2, last: 'knew' }, 2: { box: 0, due: today, seen: 1, last: 'missed' }, 128: { box: 1, due: today + 1, seen: 1, last: 'knew' } },
  spanish: true, skippedPlace: false, hideInstallTip: true, lastBackup: today - 4,
  mock: { list: 'all', ids: [5, 9, 77], log: [{ id: 5, said: 'the Constitution', auto: 'right', verdict: 'right', flipped: false }], open: { said: 'um', auto: 'unsure', verdict: null } },
  mockHistory: [{ day: today - 1, list: 'all', right: 12, wrong: 3, passed: true }],
  goal: 20, days: { [today - 1]: full, [today]: { n: 3, g: 20, ids: [1, 2, 128] } },
});

test('a backup carries everything a person did, and comes back the same', () => {
  const { state: back, saved, error } = unpack(pack(state(), new Date(2026, 10, 11)));
  assert.equal(error, undefined);
  assert.equal(saved, '2026-11-11');
  const { hideInstallTip, lastBackup, ...want } = state();
  assert.deepEqual(back, want);
});

test('what belongs to the phone stays out of the file', () => {
  const file = JSON.parse(pack(state()));
  assert.equal('hideInstallTip' in file.state, false);
  assert.equal('lastBackup' in file.state, false);
});

test('the file is named with the day it was made', () => {
  assert.equal(fileName(new Date(2026, 10, 11)), 'citizenship-backup-2026-11-11.json');
});

test('a damaged file is refused', () => {
  for (const text of ['', '   ', 'hello', '{"app":"civics128"', null, undefined, 42]) assert.equal(unpack(text).error, 'damaged');
  assert.equal(unpack('x'.repeat(MAX_BYTES + 1)).error, 'damaged');
});

test('a file from something else is refused', () => {
  for (const text of ['[]', '{}', '"civics128"', '{"app":"other","v":1,"state":{}}', '{"app":"civics128","v":1}', '{"app":"civics128","v":"1","state":{}}', '{"app":"civics128","v":1,"state":[]}']) {
    assert.equal(unpack(text).error, 'other', text);
  }
});

test('a file from a newer version of the app is refused, not half read', () => {
  assert.equal(unpack('{"app":"civics128","v":2,"state":{}}').error, 'newer');
});

test('an almost empty backup still loads, with the usual starting values', () => {
  const { state: s } = unpack('{"app":"civics128","v":1,"state":{}}');
  assert.deepEqual(s, { v: 1, place: null, typed: {}, list: 'all', cards: {}, spanish: false, skippedPlace: false, mock: null, mockHistory: [], goal: 10, days: {} });
});

test('fields the app does not know are dropped', () => {
  const text = JSON.stringify({ app: 'civics128', v: 1, state: { ...state(), admin: true, __proto__: { x: 1 }, constructor: 'x', cards: { 1: { box: 1, due: today, seen: 1, last: 'knew', evil: '<img>' } } } });
  const { state: s } = unpack(text);
  assert.equal('admin' in s, false);
  assert.equal(Object.getPrototypeOf(s), Object.prototype);
  assert.deepEqual(s.cards, { 1: { box: 1, due: today, seen: 1, last: 'knew' } });
  const dirty = unpack('{"app":"civics128","v":1,"state":{"__proto__":{"polluted":true},"cards":{"__proto__":{"box":1,"due":1,"seen":1}}}}');
  assert.equal({}.polluted, undefined);
  assert.deepEqual(dirty.state.cards, {});
});

test('cards that cannot be real are dropped, the good ones stay', () => {
  const cards = { 0: { box: 1, due: today, seen: 1 }, 129: { box: 1, due: today, seen: 1 }, abc: { box: 1, due: today, seen: 1 }, 3: { box: 9, due: today, seen: 1 }, 4: { box: 1, due: -5, seen: 1 }, 5: { box: 1, due: today, seen: 1.5 }, 6: 'knew', 7: { box: 1, due: today, seen: 2, last: 'anything else' }, 8: { box: 3, due: today + 7, seen: 4, last: 'knew' } };
  const { state: s } = unpack(JSON.stringify({ app: 'civics128', v: 1, state: { cards } }));
  assert.deepEqual(s.cards, { 7: { box: 1, due: today, seen: 2, last: 'missed' }, 8: { box: 3, due: today + 7, seen: 4, last: 'knew' } });
});

test('wrong kinds of values fall back instead of breaking the app', () => {
  const { state: s } = unpack(JSON.stringify({ app: 'civics128', v: 1, state: { place: '<b>', typed: { NJ: { senators: 'no', governor: 7, rep: 'x'.repeat(500) }, bad: {} }, list: 'everything', spanish: 'yes', goal: 7, days: { [today]: { n: 'many', g: 10 }, [today - 1]: { n: 4, g: 10, ids: [1, 1, 999, 'x'] }, soon: full }, mockHistory: [{ day: today, list: 'all', right: 99, wrong: 0 }, 'x', { day: today, list: '6520', right: 6, wrong: 1, passed: true }] } }));
  assert.equal(s.place, null);
  assert.deepEqual(s.typed, { NJ: { senators: ['', ''], governor: '', rep: 'x'.repeat(80) } });
  assert.equal(s.list, 'all');
  assert.equal(s.spanish, false);
  assert.equal(s.goal, 10);
  assert.deepEqual(s.days, { [today - 1]: { n: 4, g: 10, ids: [1] } });
  assert.deepEqual(s.mockHistory, [{ day: today, list: '6520', right: 6, wrong: 1, passed: true }]);
});

test('a broken interview is left behind; the rest still loads', () => {
  const load = (mock) => unpack(JSON.stringify({ app: 'civics128', v: 1, state: { goal: 5, mock } })).state;
  const good = state().mock;
  assert.deepEqual(load(good).mock, good);
  for (const bad of [{ ...good, ids: [5, 5, 77] }, { ...good, ids: [5, 9, 500] }, { ...good, ids: [] }, { ...good, list: 'x' }, { ...good, log: [{ id: 9, said: '', auto: 'right', verdict: 'right' }] }, { ...good, log: [{ id: 5, said: '', auto: 'right', verdict: null }] }, { ...good, log: 'none' }, 'mock', 7]) {
    const s = load(bad);
    assert.equal(s.mock, null);
    assert.equal(s.goal, 5);
  }
});

test('the summary counts what a person would compare', () => {
  const ids = Array.from({ length: 128 }, (_, i) => i + 1);
  assert.deepEqual(summary(state(), ids, today), { known: 2, total: 128, seen: 3, streak: 1, interviews: 1, place: 'NJ' });
  assert.deepEqual(summary({}, ids, today), { known: 0, total: 128, seen: 0, streak: 0, interviews: 0, place: null });
});

test('how long ago the last backup was', () => {
  assert.equal(ago(undefined, today), 'never');
  assert.equal(ago(null, today), 'never');
  assert.equal(ago(today, today), 'today');
  assert.equal(ago(today - 1, today), 'yesterday');
  assert.equal(ago(today - 12, today), '12 days ago');
});
