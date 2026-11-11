// Taps through the app at phone size, checks the "Done when" lines of Step 3 and saves
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

  // 5. offline: with the network cut, the app still opens from the saved copy
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(800);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.hello');
  await page.goto(base + '#/study/symbols-A');
  await page.waitForSelector('.q');
  assert.ok(await page.evaluate(() => document.fonts.check('700 27px Fraunces')));
  log(`${scheme}: opens and shows a study card with the network off`);
  await shot('10-offline-study');
  await ctx.setOffline(false);

  assert.deepEqual(errors, []);
  await ctx.close();
}

for (const scheme of ['light', 'dark']) await run(scheme);
await browser.close();
console.log('ALL OK');
