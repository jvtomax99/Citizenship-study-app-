// The come-back-sooner schedule. Pure functions, no browser needed (tests/srs.test.mjs).
//
// A card is {box, due, seen, last}. box 0 = missed or new, 1..5 = known, each box waits
// longer. due is a day number (see dayNumber). "guessed" counts exactly like "missed".

export const WAIT_DAYS = [0, 1, 3, 7, 14, 30]; // days to wait after reaching box n
export const ROUND_SIZE = 10;
export const RETRY_GAP = 3;  // a missed question returns after this many other questions
export const MAX_RETRIES = 2; // per question, per round

export function dayNumber(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
}

export const isMiss = (result) => result !== 'knew';

// The card after an answer. retry = the question was already missed earlier in this
// round: knowing it now only earns "see it again tomorrow", not a step up.
export function grade(card, result, today, { retry = false } = {}) {
  const prev = card || { box: 0, due: today, seen: 0 };
  const next = { ...prev, seen: prev.seen + 1, last: result };
  if (isMiss(result)) {
    next.box = 0;
    next.due = today; // stays due until it is known
  } else if (retry) {
    next.box = 0;
    next.due = today + 1;
  } else {
    next.box = Math.min(prev.box + 1, WAIT_DAYS.length - 1);
    next.due = today + WAIT_DAYS[next.box];
  }
  return next;
}

// A question counts as known when the last answer was "I knew it".
export const isKnown = (card) => !!card && card.last === 'knew';

// Which questions a round asks, in order: missed ones that are due, other due ones
// (longest overdue first), new ones, and only if those run out, ones not yet due.
export function buildRound(ids, cards, today, { size = ROUND_SIZE, shuffle = (a) => a } = {}) {
  const missed = [], due = [], fresh = [], later = [];
  for (const id of ids) {
    const c = cards[id];
    if (!c || !c.seen) fresh.push(id);
    else if (c.due <= today) (c.box === 0 ? missed : due).push(id);
    else later.push(id);
  }
  const byDue = (a, b) => cards[a].due - cards[b].due || a - b;
  missed.sort(byDue); due.sort(byDue); later.sort(byDue);
  return [...missed, ...due, ...shuffle(fresh), ...later].slice(0, size);
}

// Put a missed question back into the rest of the round, a few questions later.
export function requeue(rest, id, gap = RETRY_GAP) {
  const out = rest.slice();
  out.splice(Math.min(gap, out.length), 0, id);
  return out;
}
