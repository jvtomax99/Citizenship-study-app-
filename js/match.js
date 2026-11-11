// The officer's judgment, as pure functions (tests/match.test.mjs):
//   the interview's rules (how many questions, when it stops), and
//   judge(): is a typed or spoken answer right, wrong, or too close to call.
// Nothing here changes a question or an answer; it only reads them.

// all = the 2025 test (20 asked, 12 right passes). 6520 = age 65+ and 20+ years a resident.
export const RULES = {
  all: { ask: 20, pass: 12, fail: 9 },
  6520: { ask: 10, pass: 6, fail: 5 },
};

// Where an interview stands. log = one {verdict: 'right' | 'wrong'} per answered question.
export function standing(log, list) {
  const rule = RULES[list] || RULES.all;
  const right = log.filter((e) => e.verdict === 'right').length;
  const wrong = log.filter((e) => e.verdict === 'wrong').length;
  const passed = right >= rule.pass;
  const over = passed || wrong >= rule.fail || right + wrong >= rule.ask;
  return { ...rule, right, wrong, over, passed };
}

// The questions one interview may ask: a random pick, none twice.
export function pickQuestions(ids, list, random = Math.random) {
  const a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, (RULES[list] || RULES.all).ask);
}

// ---- checking an answer ----
// The app has no server and no AI, so it compares words. It leans toward 'unsure'
// (the person then compares and decides) over calling a right answer wrong.

const STOP = new Set(('the a an of to is are it its and or in on for by be was were that this they there because he she his her their our ' +
  'with as at from has have had do does did can will would i think um uh my your you we so must one who which what when than then also ' +
  'jr sr mr mrs ms dr b').split(' '));
const CONTINUES = new Set('of in from if for on under can to at by with or'.split(' '));
const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ORDINALS = { first: 'one', second: 'two', third: 'three', fifth: 'five', eighth: 'eight', ninth: 'nine', twelfth: 'twelve' };
const isNumber = (t) => /^\d+$/.test(t);

// "fourth" -> "four", "twentieth" -> "twenty", "22nd" -> "22"
function cardinal(w) {
  if (ORDINALS[w]) return ORDINALS[w];
  if (/^\d+(st|nd|rd|th)$/.test(w)) return w.replace(/\D+$/, '');
  if (w.endsWith('ieth') && TENS[w.slice(0, -4) + 'y']) return w.slice(0, -4) + 'y';
  if (w.endsWith('th') && (w.slice(0, -2) in UNITS)) return w.slice(0, -2);
  return w;
}

// Lowercase words with numbers as digits: "Twenty-seven" -> ["27"], "4th of July" -> ["4","of","july"].
export function words(text) {
  const raw = String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '').replace(/\b([a-z])\.(?=[a-z]\b)/g, '$1').replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bunited states( of america)?\b/g, 'us').replace(/\b(u s a|usa|u s)\b/g, 'us')
    .replace(/\bd c\b/g, 'dc').replace(/\bmlk\b/g, 'martin luther king')
    .trim().split(' ').filter(Boolean).map(cardinal);
  const out = [];
  let n = null; // a number being read, word by word
  const flush = () => { if (n !== null) { out.push(String(n)); n = null; } };
  for (let i = 0; i < raw.length; i++) {
    const w = raw[i];
    if (w in UNITS) {
      if (n !== null && n % 100 >= 20 && n % 10 === 0 && UNITS[w] < 10) n += UNITS[w]; // twenty + seven
      else if (n !== null && n % 100 === 0 && n > 0) n += UNITS[w];                      // one hundred + five
      else { flush(); n = UNITS[w]; }
    } else if (w in TENS) {
      if (n !== null && n % 100 === 0 && n > 0) n += TENS[w]; else { flush(); n = TENS[w]; }
    } else if (w === 'hundred') { n = (n === null ? 1 : n) * 100; }
    else if (w === 'thousand') { n = (n === null ? 1 : n) * 1000; }
    else if (w === 'and' && n !== null && n % 100 === 0 && (raw[i + 1] in UNITS || raw[i + 1] in TENS)) { /* one hundred and five */ }
    else {
      flush();
      if (w === 'ii') out.push('2');
      else if (w === 'iii') out.push('3');
      else if (w === 'i' && out[out.length - 1] === 'war') out.push('1'); // World War I
      else out.push(w);
    }
  }
  flush();
  // a year said in two halves: "seventeen seventy-six" -> 1776
  for (let i = 0; i < out.length - 1; i++) {
    if (/^([1-9]|1[0-9]|20)$/.test(out[i]) && /^\d\d$/.test(out[i + 1])) out.splice(i, 2, out[i] + out[i + 1]); // also "four thirty-five"
  }
  return out;
}

const stem = (w) => (w.length > 4 && !isNumber(w) ? w.replace(/(ing|ed|es|s)$/, '').replace(/ment$/, '') : w);

function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

// Is this the same word, allowing a spelling slip? Numbers must be exact. Names get more slack.
function same(a, b, name = false) {
  if (a === b) return true;
  if (isNumber(a) || isNumber(b)) return false;
  const x = stem(a), y = stem(b);
  if (x === y) return true;
  const short = Math.min(x.length, y.length);
  if (!name && x[0] !== y[0]) return false; // "Greek" is not "Creek"; a slip rarely hits the first letter
  const slack = name ? (short >= 6 ? 2 : short >= 4 ? 1 : 0) : (short >= 8 ? 2 : short >= 5 ? 1 : 0);
  return slack > 0 && distance(x, y, slack) <= slack;
}

const key = (ws) => { const k = ws.filter((w) => !STOP.has(w)); return k.length ? k : ws; };

// One accepted answer as USCIS wrote it -> the ways to say it. Each way is a list of
// groups; a group is the words any one of which will do.
//   "(U.S.) Constitution"                   -> [[constitution]]
//   "Four (4) years"                        -> [[4], [years]]
//   "Resolves disputes (disagreements) ..." -> [[resolves], [disputes, disagreements], ...]
//   "Automobile (cars, internal ... engine)"-> [[automobile]], [[cars]], [[internal],[combustion],[engine]]
export function ways(answer) {
  const parts = String(answer).split(/(\([^)]*\))/).filter((p) => p.trim());
  const main = [];
  const alts = [];
  parts.forEach((part, i) => {
    if (!part.startsWith('(')) {
      let join = false; // the word after a slash is another word for the one before: Antietam/Sharpsburg
      for (const w of words(part.replace(/\//g, ' xslashx '))) {
        if (w === 'xslashx') { join = main.length > 0; continue; }
        if (!STOP.has(w)) { if (join) main[main.length - 1].push(w); else main.push([w]); }
        join = false;
      }
      return;
    }
    const inside = part.slice(1, -1);
    const all = words(inside);
    const last = i === parts.length - 1;
    const before = i > 0 && !parts[i - 1].startsWith('(') ? words(parts[i - 1]).pop() : null;
    if (last && main.length && /^[A-Z][a-z]+$/.test(inside.trim())) {
      // one more word of the same name: "New York (Harbor)", "Valley Forge (Encampment)".
      // It may stand in for the word before it, never for the whole answer.
      main[main.length - 1].push(...key(all));
    } else if (last && main.length && !CONTINUES.has(all[0]) && !/\band\b/i.test(inside)) {
      // a second name at the end: "Presidents Day (Washington's Birthday)"
      for (const item of inside.split(',')) { const k = key(words(item)); if (k.length) alts.push(k.map((w) => [w])); }
    } else if (!last && before && !STOP.has(before) && main.length) {
      // another word for the one before: "disputes (disagreements)", "Four (4)"
      const group = main[main.length - 1];
      for (const w of key(all)) if (!group.includes(w)) group.push(w);
    } // otherwise the words are simply optional: "(U.S.) Constitution", "(of the United States)"
  });
  if (/^one of\b/i.test(answer) && main.length > 1 && main[0][0] === '1') main.shift(); // "One of the writers...": not a number
  // a closing "of the United States" adds nothing: "16th president" is the answer
  if (main.length >= 3 && main[main.length - 1].length === 1 && main[main.length - 1][0] === 'us') main.pop();
  const out = main.length ? [main] : [];
  // "Twenty-seven (27)": the second name is the same thing; keep one
  for (const a of alts) if (!out.some((w) => JSON.stringify(w) === JSON.stringify(a))) out.push(a);
  return out.length ? out : [key(words(answer)).map((w) => [w])];
}

const NEGATION = new Set('no not dont doesnt didnt never non cannot cant isnt arent wasnt without nobody none neither nor'.split(' '));
const FILLER = new Set('think believe maybe guess probably answer called name named sir maam officer yes well thats like say said know sure'.split(' '));

// How well what was said covers one way to say an answer.
//   verdict: 'right' | 'unsure' | 'wrong';  used: which said words did the covering.
// Up to three key words: all of them. Longer answers: three quarters, and every number.
function cover(said, way, name) {
  const used = new Set();
  const hit = (group) => {
    const i = said.findIndex((s) => group.some((w) => same(s, w, name)));
    if (i >= 0) used.add(i);
    return i >= 0;
  };
  const got = way.map(hit);
  const hits = got.filter(Boolean).length;
  const n = way.length;
  const numbersOk = way.every((g, i) => !g.every(isNumber) || got[i]); // a number is never optional
  const enough = n <= 3 ? hits === n : hits / n >= 0.75;
  let verdict = enough && numbersOk ? 'right' : (hits && (hits / n >= 0.5 || hits >= 2) ? 'unsure' : 'wrong');
  // "you have to pay to vote" is not "you don't have to pay to vote"
  const negated = (ws) => ws.some((w) => NEGATION.has(w));
  if (verdict === 'right' && negated(said) !== negated(way.flat())) verdict = 'unsure';
  return { verdict, used };
}

const RANK = { wrong: 0, unsure: 1, right: 2 };
const best = (results) => results.reduce((a, b) => (RANK[b.verdict] > RANK[a.verdict] ? b : a), { verdict: 'wrong', used: new Set() });

// A person's name: the last name alone is enough, as USCIS accepts for officials.
function nameWay(text) {
  const ws = words(text).filter((w) => !/^(jr|sr|2|3|iv)$/.test(w));
  return ws.length ? [[ws[ws.length - 1]]] : null;
}

// 'right' | 'wrong' | 'unsure'.
//   accepted: the answers USCIS lists (strings). Leave empty for a personal question.
//   mine: [{text, name}] the answers for this person (their senators, today's President);
//         name = it is a person's name.
//   need: how many answers the question asks for.
//   question: its text; words from it are never held against the person.
export function judge(said, { accepted = [], mine = [], need = 1, question = '' } = {}) {
  const heard = words(said);
  if (!heard.length) return 'unsure';
  if (!accepted.length && !mine.length) return 'unsure'; // nothing to compare with
  const each = [
    ...mine.map((m) => {
      if (!m.name) return best(ways(m.text).map((w) => cover(heard, w, false)));
      const way = nameWay(m.text);
      return way ? cover(heard, way, true) : { verdict: 'unsure', used: new Set() }; // a name the app cannot read
    }),
    ...accepted.map((a) => best(ways(a).map((w) => cover(heard, w, false)))),
  ];
  // Count the right ones; each must bring a word of its own ("join a group" is not two answers).
  const taken = new Set();
  let rights = 0;
  for (const r of each) {
    if (r.verdict !== 'right' || ![...r.used].some((i) => !taken.has(i))) continue;
    rights++;
    for (const i of r.used) taken.add(i);
  }
  if (rights >= need) {
    // Right words plus something else ("the vice president", "Theodore Roosevelt", "2 or 3"):
    // the extra word may change the meaning, so the person decides.
    const known = [question, ...accepted, ...mine.map((m) => m.text)].flatMap(words);
    const extra = heard.some((w, i) => !taken.has(i) && !STOP.has(w) && !FILLER.has(w) && !known.some((k) => same(w, k, true)));
    return extra ? 'unsure' : 'right';
  }
  return rights || each.some((r) => r.verdict === 'unsure') ? 'unsure' : 'wrong';
}
