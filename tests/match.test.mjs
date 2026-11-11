// The checker (js/match.js) against real-looking answers, and the interview's rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, words, ways, standing, pickQuestions, RULES } from '../js/match.js';

const qs = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url))).questions;
const byId = Object.fromEntries(qs.map((q) => [q.id, q]));
const check = (id, said) => { const q = byId[id]; return judge(said, { accepted: q.answers.map((a) => a.text), need: q.need }); };

// [question id, what the person said, what the app must decide]
const CASES = [
  // plain right answers, typed or as a phone would write them
  [2, 'The Constitution', 'right'], [2, 'the u.s. constitution', 'right'], [2, 'constitution', 'right'],
  [2, 'I think it is the US Constitution', 'right'], [2, 'la constitucion', 'right'],
  [7, '27', 'right'], [7, 'twenty-seven', 'right'], [7, 'twenty seven', 'right'], [7, 'Twenty seven amendments', 'right'],
  [21, '100', 'right'], [21, 'one hundred', 'right'], [21, 'a hundred', 'right'],
  [24, '435', 'right'], [24, 'four hundred thirty five', 'right'], [24, 'four hundred and thirty-five', 'right'],
  [22, 'six years', 'right'], [22, '6 years', 'right'], [36, 'four years', 'right'], [36, '4', 'unsure'],
  [27, 'two', 'right'], [27, '2', 'right'], [53, 'nine', 'right'], [54, 'five justices', 'right'],
  [79, 'July 4, 1776', 'right'], [79, 'July 4th 1776', 'right'], [79, 'the fourth of July, seventeen seventy-six', 'right'],
  [1, 'republic', 'right'], [1, 'a representative democracy', 'right'],
  [5, 'amendments', 'right'], [5, 'by amendment', 'right'],
  [9, 'the declaration of independence', 'right'], [9, 'Declaration of Independance', 'right'],
  [12, 'capitalism', 'right'], [12, 'capitalist', 'right'], [12, 'free market', 'right'],
  [16, 'executive, legislative and judicial', 'right'], [16, 'congress the president and the courts', 'right'],
  [17, 'the executive branch', 'right'], [19, 'the senate and the house', 'right'], [19, 'Senate and House of Representatives', 'right'],
  [40, 'the vice president', 'right'], [42, 'the president', 'right'], [52, 'the supreme court', 'right'],
  [55, 'for life', 'right'], [55, 'life', 'right'], [55, 'until they retire', 'right'],
  [51, 'resolves disagreements about the law', 'right'], [51, 'it reviews laws', 'right'],
  [58, 'print money', 'right'], [58, 'declare war', 'right'], [59, 'police', 'right'], [59, 'give a drivers license', 'right'],
  [74, 'Native Americans', 'right'], [74, 'american indians', 'right'], [75, 'people from africa', 'right'], [75, 'Africans', 'right'],
  [76, 'the revolutionary war', 'right'], [76, 'American Revolution', 'right'],
  [78, 'Jefferson', 'right'], [78, 'Thomas Jefferson', 'right'], [78, 'tomas jeferson', 'right'],
  [83, 'Hamilton', 'right'], [83, 'James Madison', 'right'],
  [90, 'Louisiana', 'right'], [92, 'the civil war', 'right'], [96, 'Civil War', 'right'],
  [94, 'he freed the slaves', 'right'], [94, 'the emancipation proclamation', 'right'], [94, 'preserved the union', 'right'],
  [94, '16th president', 'right'], [94, 'sixteenth president of the united states', 'right'],
  [97, '14th amendment', 'right'], [97, 'the fourteenth amendment', 'right'],
  [99, 'Susan B. Anthony', 'right'], [99, 'susan anthony', 'right'], [99, 'Sojourner Truth', 'right'], [99, 'harriet tubman', 'right'],
  [100, 'World War II', 'right'], [100, 'world war two', 'right'], [100, 'World War 1', 'right'], [100, 'Vietnam', 'unsure'], [100, 'the gulf war', 'right'],
  [102, '1920', 'right'], [102, 'nineteen twenty', 'right'], [102, 'the 19th amendment', 'right'],
  [104, '1929', 'right'], [104, 'the stock market crash of 1929', 'right'],
  [105, 'Roosevelt', 'right'], [105, 'Franklin Roosevelt', 'right'], [105, 'rosevelt', 'right'],
  [108, 'the Soviet Union', 'right'], [108, 'Russia', 'right'], [108, 'USSR', 'right'],
  [109, 'communism', 'right'], [110, 'to stop the spread of communism', 'right'], [110, 'stop communism', 'right'],
  [113, 'he fought for civil rights', 'right'], [113, 'civil rights', 'right'],
  [115, 'terrorists attacked the United States', 'right'], [115, 'a terrorist attack on the united states', 'right'],
  [117, 'Cherokee', 'right'], [117, 'cheroke', 'right'], [117, 'Navajo', 'right'],
  [118, 'cars', 'right'], [118, 'the light bulb', 'right'], [118, 'airplanes', 'right'],
  [119, 'Washington DC', 'right'], [119, 'Washington, D.C.', 'right'], [119, 'Washington', 'unsure'],
  [120, 'New York', 'right'], [120, 'new york harbor', 'right'], [120, 'Liberty Island', 'right'],
  [121, 'because there were thirteen original colonies', 'right'], [121, '13 colonies', 'right'],
  [122, 'because there are 50 states', 'right'], [122, 'fifty states', 'right'], [122, 'one for each state', 'right'],
  [123, 'The Star-Spangled Banner', 'right'], [123, 'star spangled banner', 'right'],
  [124, 'out of many, one', 'right'],
  [28, 'the great compromise', 'right'], [28, 'Connecticut compromise', 'right'], [28, 'equal representation', 'right'],
  [80, 'Yorktown', 'right'], [80, 'the battle of Saratoga', 'right'], [93, 'Gettysburg', 'right'], [93, 'Sharpsburg', 'right'],
  // questions that ask for more than one
  [65, 'freedom of speech, freedom of religion and the right to bear arms', 'right'],
  [65, 'freedom of speech, religion and assembly', 'right'],
  [65, 'freedom of speech and freedom of religion', 'unsure'], [65, 'freedom of speech', 'unsure'],
  [81, 'New York, New Jersey, Virginia, Georgia and Delaware', 'right'], [81, 'New York New Jersey Virginia Georgia', 'unsure'],
  [81, 'California Texas Florida Ohio Nevada', 'wrong'],
  [126, 'Christmas, Thanksgiving and Labor Day', 'right'], [126, 'Christmas and Thanksgiving', 'unsure'],
  [126, 'MLK day, Juneteenth and the fourth of July', 'unsure'], [126, 'Memorial Day, Veterans Day, Independence Day', 'right'],
  [10, 'liberty and equality', 'right'], [10, 'liberty', 'unsure'],
  [48, 'secretary of state and secretary of defense', 'right'], [48, 'attorney general', 'unsure'],
  [69, 'vote and run for office', 'right'],
  // wrong answers must not pass
  [2, 'the Bill of Rights', 'wrong'], [2, 'the president', 'wrong'], [7, '26', 'wrong'], [7, 'twenty', 'wrong'], [7, '72', 'wrong'],
  [21, '50', 'wrong'], [21, '435', 'wrong'], [24, '100', 'wrong'], [27, '22', 'wrong'], [27, 'two hundred', 'wrong'],
  [53, 'seven', 'wrong'], [78, 'George Washington', 'wrong'], [78, 'Lincoln', 'wrong'],
  [79, 'July 4, 1787', 'unsure'], [79, 'July 4th', 'unsure'], [79, '1776', 'wrong'],
  [52, 'congress', 'wrong'], [92, 'World War II', 'unsure'], [97, '13th amendment', 'unsure'], [97, '15th amendment', 'unsure'],
  [100, 'the civil war', 'unsure'], [102, '1919', 'wrong'], [105, 'Lincoln', 'wrong'], [108, 'China', 'wrong'], [108, 'Germany', 'wrong'],
  [119, 'New York', 'wrong'], [120, 'Washington', 'wrong'], [123, 'America the Beautiful', 'wrong'],
  [94, 'first president', 'wrong'], [94, 'president of the united states', 'unsure'],
  [117, 'Aztec', 'wrong'], [16, 'the president', 'wrong'], [19, 'the senate', 'unsure'],
  [2, 'I don\'t know', 'wrong'], [36, 'two years', 'unsure'], [22, 'four years', 'unsure'],
];

test('the checker judges real-looking answers as expected', () => {
  const off = CASES.filter(([id, said, want]) => check(id, said) !== want)
    .map(([id, said, want]) => `Q${id} "${said}": wanted ${want}, got ${check(id, said)}`);
  assert.deepEqual(off, []);
  assert.ok(CASES.length >= 80);
});

test('a wrong answer is never called right, even when words overlap', () => {
  // The one known soft spot: an answer that contains the right word plus more.
  assert.equal(check(42, 'the vice president'), 'right'); // "president" is in it; the person can mark it wrong
  assert.notEqual(check(36, 'two years'), 'right');
  assert.notEqual(check(97, 'the 13th amendment'), 'right');
});

test('personal answers: a last name is enough, a missing name asks the person', () => {
  const senators = { mine: [{ text: 'Cory Booker', name: true }, { text: 'Andy Kim', name: true }] };
  assert.equal(judge('Booker', senators), 'right');
  assert.equal(judge('senator cory booker', senators), 'right');
  assert.equal(judge('Corey Bookar', senators), 'right');
  assert.equal(judge('Kim', senators), 'right');
  assert.equal(judge('Chuck Schumer', senators), 'wrong');
  assert.equal(judge('Cory', senators), 'wrong');
  assert.equal(judge('Booker', {}), 'unsure');
  assert.equal(judge('Trenton', { mine: [{ text: 'Trenton', name: false }] }), 'right');
  assert.equal(judge('Newark', { mine: [{ text: 'Trenton', name: false }] }), 'wrong');
  assert.equal(judge('John Roberts Jr', { mine: [{ text: 'John G. Roberts, Jr.', name: true }] }), 'right');
  assert.equal(judge('', senators), 'unsure');
});

test('numbers and words are read the same way', () => {
  assert.deepEqual(words('Twenty-seven (27)'), ['27', '27']);
  assert.deepEqual(words('Four hundred thirty-five'), ['435']);
  assert.deepEqual(words('the 22nd Amendment'), ['the', '22', 'amendment']);
  assert.deepEqual(words('World War I and World War II'), ['world', 'war', '1', 'and', 'world', 'war', '2']);
  assert.deepEqual(words('U.S. citizens of the United States'), ['us', 'citizens', 'of', 'the', 'us']);
  assert.deepEqual(words('nineteen twenty'), ['1920']);
  assert.deepEqual(words('one two'), ['1', '2']);
});

test('parentheses: optional words, another word, a second name', () => {
  assert.deepEqual(ways('(U.S.) Constitution'), [[['constitution']]]);
  assert.deepEqual(ways('Four (4) years'), [[['4'], ['years']]]);
  assert.deepEqual(ways('Twenty-seven (27)'), [[['27']]]);
  assert.deepEqual(ways('The President (of the United States)'), [[['president']]]);
  assert.deepEqual(ways('Presidents Day (Washington\'s Birthday)'), [[['presidents'], ['day']], [['washingtons'], ['birthday']]]);
  assert.deepEqual(ways('(Battle of) Antietam/Sharpsburg'), [[['antietam', 'sharpsburg']]]);
});

test('every accepted answer in the bank passes when said word for word', () => {
  const off = [];
  for (const q of qs.filter((x) => x.kind === 'fixed')) {
    for (const a of q.answers) {
      const plain = a.text.replace(/\(\d+\)/g, ' ').replace(/[()]/g, ' ');
      const got = judge(plain, { accepted: [a.text], need: 1 });
      if (got !== 'right') off.push(`Q${q.id} "${a.text}" -> ${got}`);
    }
  }
  assert.deepEqual(off, []);
});

test('the interview stops as USCIS does', () => {
  const log = (r, w) => [...Array(r).fill({ verdict: 'right' }), ...Array(w).fill({ verdict: 'wrong' })];
  assert.deepEqual(RULES.all, { ask: 20, pass: 12, fail: 9 });
  assert.deepEqual(RULES[6520], { ask: 10, pass: 6, fail: 5 });
  assert.equal(standing(log(11, 8), 'all').over, false);
  assert.equal(standing(log(12, 0), 'all').passed, true);
  assert.equal(standing(log(12, 8), 'all').passed, true);
  assert.deepEqual([standing(log(11, 9), 'all').over, standing(log(11, 9), 'all').passed], [true, false]);
  assert.equal(standing(log(5, 4), '6520').over, false);
  assert.equal(standing(log(6, 4), '6520').passed, true);
  assert.deepEqual([standing(log(5, 5), '6520').over, standing(log(5, 5), '6520').passed], [true, false]);
  // however the answers fall, it is decided within 20 (or 10) questions
  for (const [list, max] of [['all', 20], ['6520', 10]]) {
    for (let r = 0; r <= max; r++) assert.equal(standing(log(r, max - r), list).over, true);
  }
  const ids = qs.map((q) => q.id);
  const picked = pickQuestions(ids, 'all');
  assert.equal(picked.length, 20);
  assert.equal(new Set(picked).size, 20);
  const stars = ids.filter((id) => byId[id].star6520);
  assert.equal(pickQuestions(stars, '6520').length, 10);
});
