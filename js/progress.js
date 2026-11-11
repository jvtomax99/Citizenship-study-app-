// How far along a person is: the light of each landmark, today's goal, the streak.
// Pure functions, no browser needed (tests/progress.test.mjs).
import { isKnown } from './srs.js';

// A question is "strong" once it was known on two different days: box 2 or higher in
// js/srs.js (a box only goes up when the question was due, so at least a day apart).
const STRONG_BOX = 2;
export const GOALS = [5, 10, 20];
const KEEP_DAYS = 60;
const REST_EVERY = 7; // one missed day is forgiven in any seven

// One landmark. light runs 0..1 with the share of questions known; lit only when every
// question is strong. A miss puts the question's box back to 0, so the landmark dims.
export function landmark(ids, cards) {
  const known = ids.filter((id) => isKnown(cards[id])).length;
  const strong = ids.filter((id) => isKnown(cards[id]) && cards[id].box >= STRONG_BOX).length;
  const total = ids.length;
  return { known, strong, total, light: total ? known / total : 0, lit: total > 0 && strong === total };
}

// days is {dayNumber: {n, g}}: questions answered that day and the goal it was held to.
// The goal is kept per day so changing it later never rewrites the past.
export function addAnswer(days, today, goal) {
  const out = {};
  for (const [d, v] of Object.entries(days || {})) if (today - d < KEEP_DAYS) out[d] = v;
  out[today] = { n: (out[today]?.n || 0) + 1, g: goal };
  return out;
}

export const answeredOn = (days, d) => days?.[d]?.n || 0;
export const metOn = (days, d) => !!days?.[d] && days[d].n >= days[d].g;

// Days in a row with the goal met. Today not met yet is not a miss. One missed day
// between two met days is a rest day, at most one in any seven days.
export function streak(days, today) {
  let count = 0, lastRest = null;
  const rest = [];
  let d = metOn(days, today) ? today : today - 1;
  for (; ; d--) {
    if (metOn(days, d)) { count++; continue; }
    const allowed = lastRest === null || lastRest - d >= REST_EVERY;
    if (allowed && metOn(days, d - 1)) { rest.push(d); lastRest = d; continue; }
    break;
  }
  return { count, rest };
}

// The last seven days, oldest first, for the row of dots.
const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export function week(days, today) {
  const { rest } = streak(days, today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = today - 6 + i;
    const state = metOn(days, d) ? 'met' : rest.includes(d) ? 'rest' : answeredOn(days, d) ? 'some' : 'none';
    return { day: d, letter: LETTERS[(((d + 4) % 7) + 7) % 7], state, today: d === today };
  });
}
