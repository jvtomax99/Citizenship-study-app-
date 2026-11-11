// Taps through the app at phone size, checks the "Done when" lines of Steps 3 and 4 and saves
// screenshots. Run a local server first (python3 -m http.server 8123), then:
//   node tools/shots.mjs [folder for the pictures] [http://localhost:8123/]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const out = process.argv[2] || 'preview/shots';
const base = process.argv[3] || 'http://localhost:8123/';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const log = (m) => console.log('ok  ' + m);
const TAP = 330; // the app ignores a second tap within 300 ms of a new screen

async function run(scheme) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name, full = false) => { await page.waitForTimeout(350); await page.screenshot({ path: `${out}/${name}-${scheme}.png`, fullPage: full }); };
  // record what the speaker button is asked to say
  await page.addInitScript(() => {
    window.__said = [];
    const real = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => { window.__said.push({ text: u.text, lang: u.lang }); try { real(u); } catch {} };
    // a pretend microphone: it "hears" whatever window.__hear says
    class Hear { start() { setTimeout(() => { this.onresult({ results: [[{ transcript: window.__hear || '' }]] }); this.onend(); }, 150); } abort() { if (this.onend) this.onend(); } }
    window.SpeechRecognition = Hear; window.webkitSpeechRecognition = Hear;
  });

  // 1. first visit lands on the state picker
  await page.goto(base);
  await page.waitForSelector('#find');
  assert.match(page.url(), /#\/place$/);
  assert.equal(await page.locator('#places .row').count(), 56);
  await shot('1-pick-state');
  await page.fill('#find', 'new j');
  assert.equal(await page.locator('#places .row:visible').count(), 1);
  await page.locator('#places .row:visible').click();
  await page.waitForSelector('#rep');
  const nj = await page.locator('.card').innerText();
  for (const t of ['Trenton', 'Cory A. Booker', 'Andy Kim', 'Mikie Sherrill', 'Checked Nov 11, 2026']) assert.ok(nj.includes(t), t);
  await page.fill('#rep', 'Test Representative');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['civics128.v1']).typed.NJ.rep), 'Test Representative', 'typed names are kept without Save');
  await shot('2-state-new-jersey', true);
  await page.click('[data-act=save]');
  await page.waitForSelector('.hello');
  log(`${scheme}: state picker, New Jersey names with checked dates`);
  await shot('3-home', true);

  // 2. picking a state changes the answers everywhere (study card for question 23)
  const answerOf = async (id) => {
    await page.goto('about:blank'); // a fresh start, so the cards begin at question 1
    await page.goto(base + '#/study/all');
    await page.waitForSelector('.q');
    await page.evaluate((n) => { for (let i = 1; i < n; i++) document.querySelector('[data-act=show]').click(), document.querySelector('[data-act=next]').click(); }, id);
    await page.waitForTimeout(TAP);
    await page.click('[data-act=show]');
    return page.locator('.answers').innerText();
  };
  let a23 = await answerOf(23);
  assert.ok(a23.includes('Cory A. Booker') && a23.includes('Andy Kim') && a23.includes('Answers will vary.'));
  assert.ok((await answerOf(62)).includes('Trenton'));
  assert.ok((await answerOf(29)).includes('Test Representative'));
  await page.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1']); s.place = 'NY'; localStorage['civics128.v1'] = JSON.stringify(s); });
  await page.reload();
  a23 = await answerOf(23);
  assert.ok(a23.includes('Charles E. Schumer') || a23.includes('Schumer'), a23);
  assert.ok(!a23.includes('Booker'));
  assert.ok((await answerOf(62)).includes('Albany'));
  await page.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1']); s.place = 'DC'; localStorage['civics128.v1'] = JSON.stringify(s); });
  await page.reload();
  assert.ok((await answerOf(61)).includes('D.C. does not have a governor.'));
  await page.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1']); s.place = 'PR'; localStorage['civics128.v1'] = JSON.stringify(s); });
  await page.reload();
  assert.ok((await answerOf(29)).includes('no voting representatives in Congress'));
  assert.ok((await answerOf(62)).includes('San Juan'));
  await page.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1']); s.place = 'NJ'; localStorage['civics128.v1'] = JSON.stringify(s); });
  await page.reload();
  log(`${scheme}: changing the state changes answers 23, 29, 61, 62`);

  // 3. study: flip through a section, hear a question, Spanish with the draft mark
  await page.goto(base + '#/study');
  await page.waitForSelector('.rows .row');
  await shot('4-study-sections', true);
  await page.click('a.row[href="#/study/government-A"]');
  await page.waitForSelector('.q');
  const q1 = await page.locator('.q').innerText();
  assert.equal(q1, 'What is the form of government of the United States?');
  await page.click('[data-act=speak]');
  const said = await page.evaluate(() => window.__said);
  assert.deepEqual(said.at(-1), { text: q1, lang: 'en-US' });
  await page.waitForTimeout(TAP);
  await page.click('[data-act=spanish]');
  assert.ok((await page.locator('.es').innerText()).includes('borrador'));
  await page.waitForTimeout(TAP);
  await page.click('[data-act=show]');
  assert.equal(await page.locator('.alist li').count(), 3);
  await shot('5-study-card-spanish', true);
  let flips = 1;
  while (await page.locator('[data-act=next]').count()) { await page.waitForTimeout(TAP); await page.click('[data-act=next]'); await page.waitForTimeout(TAP); await page.click('[data-act=show]'); flips++; }
  assert.equal(flips, 15);
  await page.waitForTimeout(TAP);
  await page.click('[data-act=done]');
  await page.waitForSelector('.rows .row');
  await page.click('a.row[href="#/study/government-A"]');
  await page.waitForSelector('.q');
  assert.ok((await page.locator('.tally').innerText()).includes('1 / 15'), 'a finished section starts over');
  log(`${scheme}: flipped 15 cards of a section, read-aloud asked for the exact question in en-US`);
  await page.waitForTimeout(TAP);
  await page.click('[data-act=spanish]');

  // 4. drill: a miss and a guess come back in the round; knew does not
  await page.goto(base + '#/drill');
  await page.waitForSelector('[data-act=show]');
  await shot('6-drill-ask');
  const seen = [];
  const plan = ['missed', 'guessed', 'knew', 'knew', 'knew', 'knew', 'knew', 'knew', 'knew', 'knew'];
  let step = 0, firstShot = false;
  while (await page.locator('[data-act=show]').count()) {
    const q = await page.locator('.q').innerText();
    const again = seen.includes(q);
    seen.push(q);
    await page.waitForTimeout(TAP);
    await page.click('[data-act=show]');
    if (!firstShot) { await shot('7-drill-answers', true); firstShot = true; }
    await page.waitForTimeout(TAP);
    await page.click(`[data-result=${again ? 'knew' : plan[step++]}]`);
    await page.waitForTimeout(30);
  }
  assert.equal(seen.length, 12, 'ten questions plus the two that came back');
  assert.equal(seen.indexOf(seen[0], 1), 4, 'the missed question returned three questions later');
  assert.equal(seen.indexOf(seen[1], 2), 5, 'the guessed question returned too');
  assert.equal(seen.filter((q) => q === seen[2]).length, 1, 'a known question was asked once');
  const score = await page.locator('.score').innerText();
  assert.match(score.replace(/\s+/g, ' '), /8 knew it 1 guessed 1 missed/);
  await shot('8-drill-results');
  // the next round starts with the two that were missed or guessed... they were known
  // on the second try, so they are due tomorrow, and today's round is all new questions
  const cards = await page.evaluate(() => JSON.parse(localStorage['civics128.v1']).cards);
  const vals = Object.values(cards);
  assert.equal(vals.length, 10);
  assert.equal(vals.filter((c) => c.box === 0).length, 2, 'missed and guessed both sit in box 0');
  assert.equal(vals.filter((c) => c.box === 1).length, 8);
  await page.goto(base + '#/');
  await page.waitForSelector('.hello');
  assert.ok((await page.locator('.known').innerText()).includes('10 of 128'));
  log(`${scheme}: drill round, miss and guess both came back, progress saved`);
  await shot('9-home-after-drill');

  // 5. mock interview: read aloud, voice, the check, the overrule, the 12 or 9 stop
  const bank = (await (await fetch(base + 'data/questions.json')).json()).questions;
  const byText = Object.fromEntries(bank.map((q) => [q.question, q]));
  const tap = async (sel) => { await page.waitForTimeout(TAP); await page.click(sel); };
  const rightAnswer = (q) => q.answers.slice(0, q.need).map((a) => a.text.replace(/\(\d+\)/g, ' ').replace(/[()]/g, ' ')).join(', ');
  await tap('a[href="#/mock"]');
  await page.waitForSelector('[data-act=fresh]');
  assert.ok((await page.locator('.lead').innerText()).includes('up to 20 questions'));
  await shot('10-mock-start');
  await tap('[data-act=fresh]');
  await page.waitForSelector('#answer');
  let q = byText[await page.locator('.q').innerText()];
  assert.equal((await page.evaluate(() => window.__said.at(-1))).text, q.question, 'the officer reads the question by himself');
  assert.equal(await page.locator('.es-toggle').count(), 0, 'no Spanish during the interview');
  await shot('11-mock-ask');
  // question 1 by voice: the phone "hears" a wrong answer, the app says so, the person overrules it
  await page.evaluate(() => { window.__hear = 'I think it is the banana'; });
  await tap('[data-act=mic]');
  await page.waitForFunction(() => document.querySelector('#answer').value === 'I think it is the banana');
  await tap('[data-act=check]');
  await page.waitForSelector(q.kind === 'fixed' ? '.sheet.wrong' : '.sheet');
  if (await page.locator('[data-verdict]').count()) await tap('[data-verdict=wrong]');
  await shot('12-mock-wrong');
  await tap('[data-act=flip]');
  await page.waitForSelector('.sheet.right');
  assert.equal(await page.locator('.st.on').count(), 0, 'the star is earned when the answer is counted');
  await shot('13-mock-overruled');
  await tap('[data-act=next]');
  assert.equal(await page.locator('.st.on').count(), 1);
  // question 2: typed right, then "I was actually wrong"
  let asked = 1;
  const answerRight = async () => {
    q = byText[await page.locator('.q').innerText()];
    asked++;
    if (q.kind === 'fixed') {
      await page.fill('#answer', rightAnswer(q));
      await tap('[data-act=check]');
      await page.waitForSelector('.sheet.right', { timeout: 3000 }).catch(() => { throw new Error(`a word-for-word answer was not judged right: Q${q.id}`); });
    } else {
      await page.fill('#answer', 'Somebody Unknown');
      await tap('[data-act=check]');
      await page.waitForSelector('.sheet');
      if (await page.locator('[data-verdict]').count()) {
        await tap('[data-verdict=right]');
      } else await tap('[data-act=flip]');
      await page.waitForSelector('.sheet.right');
    }
  };
  await answerRight();
  await tap('[data-act=flip]');
  await page.waitForSelector('.sheet.wrong');
  await tap('[data-act=next]');
  assert.ok((await page.locator('.road').innerText()).includes('1 of 9'));
  // leave and come back: the interview is still there
  await tap('a.x');
  await page.waitForSelector('.hello');
  assert.ok((await page.locator('a[href="#/mock"]').innerText()).toLowerCase().includes('continue the interview · 2 answered'));
  await tap('a[href="#/mock"]');
  await tap('[data-act=go]');
  await page.waitForSelector('#answer');
  // "I don't know" is a miss with nothing to overrule
  await tap('[data-act=skip]');
  await page.waitForSelector('.sheet.wrong');
  assert.equal(await page.locator('[data-act=flip]').count(), 0);
  await tap('[data-act=next]');
  asked++;
  // 11 more right answers: it stops at 12 right
  for (let i = 0; i < 11; i++) {
    await answerRight();
    if (i === 3) await shot('14-mock-right');
    if (i === 10) assert.equal(await page.locator('[data-act=next]').innerText(), 'SEE THE RESULT');
    await tap('[data-act=next]');
  }
  await page.waitForSelector('.review');
  assert.equal(await page.locator('.title').innerText(), 'You passed!');
  assert.match((await page.locator('.score').innerText()).replace(/\s+/g, ' '), /12 right 2 wrong 12 to pass/);
  assert.equal(await page.locator('.review details').count(), 14);
  assert.equal(asked, 14);
  await shot('15-mock-passed', true);
  // 65/20: ten questions, six to pass; five misses end it
  await tap('a.btn[href="#/"]');
  await page.waitForSelector('.hello');
  assert.ok((await page.locator('.hint.center').innerText()).includes('passed, 12 right and 2 wrong'));
  assert.equal(await page.locator('a[href="#/mock"]').innerText(), 'MOCK INTERVIEW', 'a finished interview is not offered again');
  await tap('[data-list="6520"]');
  await tap('a[href="#/mock"]');
  await page.waitForSelector('[data-act=fresh]');
  assert.ok((await page.locator('.lead').innerText()).includes('up to 10 questions'));
  await tap('[data-act=fresh]');
  await page.waitForSelector('#answer');
  assert.equal(await page.locator('.st').count(), 6);
  assert.equal(await page.locator('.chip.star').count(), 1);
  for (let i = 0; i < 5; i++) {
    assert.equal(await page.locator('#answer').count(), 1, 'still asking');
    if (i === 0) { // no answer typed: the app does not guess, the person compares and marks it
      await tap('[data-act=check]');
      await page.waitForSelector('.sheet.ask');
      await shot('17-mock-6520-compare');
      await tap('[data-verdict=wrong]');
    } else await tap('[data-act=skip]');
    await tap('[data-act=next]');
  }
  await page.waitForSelector('.review');
  assert.equal(await page.locator('.title').innerText(), 'Not yet');
  assert.match((await page.locator('.score').innerText()).replace(/\s+/g, ' '), /0 right 5 wrong 6 to pass/);
  await shot('18-mock-not-yet', true);
  const after = await page.evaluate(() => JSON.parse(localStorage['civics128.v1']));
  assert.equal(after.mockHistory.length, 2);
  assert.ok(Object.values(after.cards).filter((c) => c.last === 'missed').length >= 5, 'interview misses go to the drill');
  await tap('a.btn[href="#/"]');
  await page.waitForSelector('.hello');
  await tap('[data-list="all"]');
  await shot('19-home-after-interviews', true);
  log(`${scheme}: mock interview passed at 12 right (voice, overrule both ways, leave and continue), 65/20 stopped at 5 misses`);

  // 6. offline: with the network cut, the app still opens from the saved copy
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(800);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.hello');
  await page.goto(base + '#/study/symbols-A');
  await page.waitForSelector('.q');
  assert.ok(await page.evaluate(() => document.fonts.check('700 27px Fraunces')));
  log(`${scheme}: opens and shows a study card with the network off`);
  await shot('20-offline-study');
  await ctx.setOffline(false);

  assert.deepEqual(errors, []);
  await ctx.close();
}

for (const scheme of ['light', 'dark']) await run(scheme);
await browser.close();
console.log('ALL OK');
