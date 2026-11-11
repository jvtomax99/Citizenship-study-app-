// Run: node --test tests/*.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { grade, buildRound, requeue, isKnown, dayNumber, WAIT_DAYS } from '../js/srs.js';

const T = 20000; // "today" as a day number

test('a missed question returns before a right one', () => {
  const missed = grade(undefined, 'missed', T);
  const right = grade(undefined, 'knew', T);
  assert.ok(missed.due < right.due);
  // and the next round asks the missed one first, the right one not at all yet
  const round = buildRound([1, 2, 3], { 1: right, 2: missed }, T, { size: 2 });
  assert.deepEqual(round, [2, 3]);
});

test('"I guessed" counts exactly like "I missed it"', () => {
  const known = { box: 3, due: T, seen: 4, last: 'knew' };
  const g = grade(known, 'guessed', T), m = grade(known, 'missed', T);
  assert.deepEqual({ box: g.box, due: g.due }, { box: m.box, due: m.due });
  assert.equal(g.box, 0);
  assert.equal(isKnown(g), false);
});

test('knowing it waits 1, 3, 7, 14, then 30 days', () => {
  let c, day = T; const waits = [];
  for (let i = 0; i < 6; i++) { c = grade(c, 'knew', day); waits.push(c.due - day); day = c.due; }
  assert.deepEqual(waits, [1, 3, 7, 14, 30, 30]);
  assert.deepEqual(WAIT_DAYS.slice(1), [1, 3, 7, 14, 30]);
});

test('a miss, then knowing it later in the same round, still comes back tomorrow', () => {
  const m = grade(undefined, 'missed', T);
  const again = grade(m, 'knew', T, { retry: true });
  assert.equal(again.due, T + 1);
  assert.equal(again.box, 0);
  assert.equal(grade(again, 'knew', T + 1).due, T + 2);
});

test('practising early does not push a question further away', () => {
  const c = { box: 1, due: T + 1, seen: 1, last: 'knew' };
  const early = grade(c, 'knew', T);
  assert.deepEqual({ box: early.box, due: early.due }, { box: 1, due: T + 1 });
  assert.equal(grade(c, 'guessed', T).due, T); // but a miss still counts
});

test('round order: due missed, other due, new, then not yet due', () => {
  const cards = {
    1: { box: 2, due: T + 5, seen: 2, last: 'knew' },  // not due
    2: { box: 2, due: T - 1, seen: 2, last: 'knew' },  // due
    3: { box: 0, due: T, seen: 1, last: 'missed' },    // due, missed
    5: { box: 1, due: T - 3, seen: 1, last: 'knew' },  // due, longer overdue
  };
  assert.deepEqual(buildRound([1, 2, 3, 4, 5], cards, T), [3, 5, 2, 4, 1]);
  assert.equal(buildRound([1, 2, 3, 4, 5], cards, T, { size: 2 }).length, 2);
});

test('a missed question goes back in three questions later, or at the end', () => {
  assert.deepEqual(requeue([2, 3, 4, 5], 1), [2, 3, 4, 1, 5]);
  assert.deepEqual(requeue([2], 1), [2, 1]);
  assert.deepEqual(requeue([], 1), [1]);
});

test('the day changes at local midnight', () => {
  const a = dayNumber(new Date(2026, 10, 11, 23, 59)), b = dayNumber(new Date(2026, 10, 12, 0, 1));
  assert.equal(b - a, 1);
});
