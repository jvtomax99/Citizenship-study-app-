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

// 'right' | 'wrong' | 'unsure'. accepted = the answers USCIS lists; mine = the names for
// this person (their senators, today's President); need = how many answers are asked for.
export function judge(said, { accepted = [], mine = [], need = 1 } = {}) {
  return 'unsure'; // the real check comes next; until then the person compares
}
