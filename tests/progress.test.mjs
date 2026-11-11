import test from 'node:test';
import assert from 'node:assert/strict';
import { landmark, addAnswer, streak, week, metOn } from '../js/progress.js';
import { grade } from '../js/srs.js';

const met = (...ds) => Object.fromEntries(ds.map((d) => [d, { n: 10, g: 10 }]));

test('a landmark brightens with each question known', () => {
  const cards = { 1: { box: 1, last: 'knew' }, 2: { box: 0, last: 'missed' } };
  const l = landmark([1, 2, 3, 4], cards);
  assert.equal(l.known, 1);
  assert.equal(l.light, 0.25);
  assert.equal(l.lit, false);
});

test('one lucky day does not light a landmark; two different days do', () => {
  let cards = {};
  for (const id of [1, 2]) cards[id] = grade(cards[id], 'knew', 100);
  assert.equal(landmark([1, 2], cards).light, 1);
  assert.equal(landmark([1, 2], cards).lit, false);
  for (const id of [1, 2]) cards[id] = grade(cards[id], 'knew', 100); // same day again: no step up
  assert.equal(landmark([1, 2], cards).lit, false);
  for (const id of [1, 2]) cards[id] = grade(cards[id], 'knew', 101);
  assert.equal(landmark([1, 2], cards).lit, true);
});

test('a later miss dims a lit landmark', () => {
  const cards = { 1: { box: 3, last: 'knew', seen: 3, due: 90 }, 2: { box: 2, last: 'knew', seen: 2, due: 90 } };
  assert.equal(landmark([1, 2], cards).lit, true);
  cards[2] = grade(cards[2], 'missed', 100);
  const l = landmark([1, 2], cards);
  assert.equal(l.lit, false);
  assert.equal(l.light, 0.5);
});

test('knowing a question on a retry in the same round is known but not strong', () => {
  let c = grade(undefined, 'missed', 100);
  c = grade(c, 'knew', 100, { retry: true });
  const l = landmark([1], { 1: c });
  assert.equal(l.known, 1);
  assert.equal(l.strong, 0);
});

test('an empty part is never lit', () => assert.equal(landmark([], {}).lit, false));

test('answers add up per day and the goal is reached at the goal', () => {
  let days = {};
  for (let i = 0; i < 9; i++) days = addAnswer(days, 100, 10);
  assert.equal(metOn(days, 100), false);
  days = addAnswer(days, 100, 10);
  assert.equal(metOn(days, 100), true);
  assert.equal(streak(days, 100).count, 1);
});

test('changing the goal later does not rewrite earlier days', () => {
  let days = {};
  for (let i = 0; i < 5; i++) days = addAnswer(days, 100, 5);
  for (let i = 0; i < 5; i++) days = addAnswer(days, 101, 20);
  assert.equal(metOn(days, 100), true);
  assert.equal(metOn(days, 101), false);
});

test('old days are dropped after 60', () => {
  const days = addAnswer({ 1: { n: 10, g: 10 }, 95: { n: 10, g: 10 } }, 100, 10);
  assert.deepEqual(Object.keys(days), ['95', '100']);
});

test('the streak counts days in a row; today not done yet is not a miss', () => {
  assert.equal(streak(met(98, 99, 100), 100).count, 3);
  assert.equal(streak(met(98, 99), 100).count, 2);
  assert.equal(streak({}, 100).count, 0);
});

test('one missed day is a rest day and does not break the streak', () => {
  const s = streak(met(96, 97, 99, 100), 100);
  assert.equal(s.count, 4);
  assert.deepEqual(s.rest, [98]);
});

test('yesterday missed, today not done yet: the streak is still alive', () => {
  assert.equal(streak(met(97, 98), 100).count, 2);
});

test('two missed days in a row end the streak', () => {
  assert.equal(streak(met(95, 96, 99, 100), 100).count, 2);
  assert.equal(streak(met(96, 97), 100).count, 0);
});

test('a second missed day within seven days ends the streak there', () => {
  // met 100, 99, rest 98, met 97, 96, miss 95 (only 3 days after the rest day), met 94
  const s = streak(met(94, 96, 97, 99, 100), 100);
  assert.equal(s.count, 4);
  assert.deepEqual(s.rest, [98]);
});

test('rest days seven or more days apart are both forgiven', () => {
  const s = streak(met(90, 92, 93, 94, 95, 96, 97, 98, 100), 100);
  assert.deepEqual(s.rest, [99, 91]);
  assert.equal(s.count, 9);
});

test('the week row marks met, rest, some and none, and today', () => {
  const days = { ...met(96, 97, 99), 100: { n: 3, g: 10 } };
  const w = week(days, 100);
  assert.deepEqual(w.map((x) => x.state), ['none', 'none', 'met', 'met', 'rest', 'met', 'some']);
  assert.equal(w[6].today, true);
  assert.equal(w.length, 7);
});

test('weekday letters: day 0 was a Thursday', () => {
  assert.equal(week({}, 6)[0].letter, 'T');
  assert.equal(week({}, 6)[3].letter, 'S');
});
