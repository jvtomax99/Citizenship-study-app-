// Taps through the app at phone size, checks the "Done when" lines of Steps 3 to 6 and saves
// screenshots. Run a local server first (python3 -m http.server 8123), then:
//   node tools/shots.mjs [folder for the pictures] [http://localhost:8123/]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
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
  assert.ok((await page.locator('.goal-hit').innerText()).includes('Goal reached'));
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
  // Step 5: ten first answers reach the daily goal of 10, and the streak goes up
  assert.ok((await page.locator('.today').innerText()).replace(/\s+/g, ' ').includes('10 of 10 questions · goal reached'));
  assert.ok((await page.locator('.streak').innerText()).includes('1 day in a row'));
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

  // Step 5: the Mall. Knowing a part's questions brightens its landmark; knowing them
  // again another day lights it; a miss dims it. The streak forgives one missed day.
  const stop = 'button[data-key="history-B"]';
  const lightOf = () => page.locator('.stop', { has: page.locator(stop) }).evaluate((el) => ({ l: Number(el.style.getPropertyValue('--l')), lit: el.classList.contains('lit'), filter: getComputedStyle(el.querySelector('img')).filter }));
  const drillPart = async (results) => {
    await page.goto(base + '#/mall');
    await tap(stop);
    await tap('a[href="#/drill/history-B"]');
    await page.waitForSelector('[data-act=show]');
    let i = 0;
    while (await page.locator('[data-act=show]').count() && i < results.length) {
      await tap('[data-act=show]');
      await tap(`[data-result=${results[i++]}]`);
    }
    await page.goto(base + '#/mall');
    await page.waitForSelector('.stop');
  };
  await page.evaluate(() => { const k = 'civics128.v1'; const s = JSON.parse(localStorage[k]); s.cards = {}; localStorage[k] = JSON.stringify(s); });
  await page.goto(base + '#/mall');
  await page.reload();
  await page.waitForSelector('.stop');
  assert.equal(await page.locator('.stop').count(), 8);
  const dim = await lightOf();
  assert.equal(dim.l, 0);
  await shot('21-mall-start', true);
  await drillPart(Array(10).fill('knew'));
  const bright = await lightOf();
  assert.equal(bright.l, 1, 'all ten known: full light');
  assert.equal(bright.lit, false, 'known once is not lit yet');
  assert.notEqual(bright.filter, dim.filter, 'the picture itself changed');
  await tap(stop);
  await shot('22-mall-known-once', true);
  // the next day: every card is due again
  await page.evaluate(() => { const k = 'civics128.v1'; const s = JSON.parse(localStorage[k]); for (const id in s.cards) s.cards[id].due -= 1; localStorage[k] = JSON.stringify(s); });
  await page.reload();
  await drillPart(Array(10).fill('knew'));
  assert.equal((await lightOf()).lit, true, 'known on two different days: lit');
  assert.ok((await page.locator('.tally').innerText()).includes('1 of 8'));
  await shot('23-mall-lit', true);
  await drillPart(['missed']);
  const after1 = await lightOf();
  assert.equal(after1.lit, false, 'a miss dims a lit landmark');
  assert.equal(after1.l, 0.9);
  await shot('24-mall-dimmed');
  // opening the Mall on a slowed-down phone (4x slower chip, slow 4G) stays under 2 seconds.
  // This is the saved copy every visit after the first uses; for a first-ever visit run
  // tools/shots.mjs against the real site, which shrinks files in transit (this server does not).
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('about:blank');
  const t0 = Date.now();
  await page.goto(base + '#/mall');
  await page.waitForFunction(() => { const im = document.querySelector('.stop img'); return im && im.complete && im.naturalWidth > 0; });
  const ms = Date.now() - t0;
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  assert.ok(ms < 2000, `the Mall took ${ms} ms`);
  log(`${scheme}: a landmark brightens, lights after two days, dims on a miss; the Mall opened in ${ms} ms on a slowed phone`);
  // the streak: goal met three days ago and two days ago, yesterday missed (a rest day), today met
  await page.evaluate(() => {
    const k = 'civics128.v1'; const s = JSON.parse(localStorage[k]);
    const t = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const full = { n: 10, g: 10 };
    s.days = { [t - 3]: full, [t - 2]: full, [t]: full };
    localStorage[k] = JSON.stringify(s);
  });
  await page.goto(base + '#/');
  await page.reload();
  await page.waitForSelector('.today');
  assert.ok((await page.locator('.streak').innerText()).includes('3 days in a row'));
  assert.equal(await page.locator('.day.rest').count(), 1);
  assert.ok((await page.locator('.strip').innerText()).includes('0 of 8 lit'));
  await tap('[data-act=pickgoal]');
  await tap('[data-goal="20"]');
  assert.ok((await page.locator('.today').innerText()).replace(/\s+/g, ' ').includes('10 of 20 questions'));
  assert.ok((await page.locator('.streak').innerText()).includes('2 days in a row'), 'today is held to the new goal, earlier days keep theirs');
  await tap('[data-act=pickgoal]');
  await shot('25-home-goal-choice', true);
  await tap('[data-goal="10"]');
  await shot('26-home-streak-rest-day', true);
  log(`${scheme}: the goal, the week with a rest day, the streak and the goal choice`);

  // 7. backup: save a file, start as a new phone, load the file, see the same progress
  const kept = () => page.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1'] || '{}'); return JSON.stringify([s.place, s.typed, s.list, s.cards, s.goal, s.days, s.mockHistory]); });
  const before = await kept();
  const knownLine = (await page.locator('.known p').first().innerText()).trim();
  assert.ok((await page.locator('.more').innerText()).includes('Last saved: never'));
  await tap('.more a[href="#/backup"]');
  await page.waitForSelector('[data-act=save]');
  await shot('27-backup', true);
  await page.waitForTimeout(TAP);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=save]')]);
  assert.match(dl.suggestedFilename(), /^citizenship-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await dl.path();
  const fileText = readFileSync(file, 'utf8');
  assert.ok((await page.locator('.note.ok').innerText()).includes(dl.suggestedFilename()));
  assert.ok((await page.locator('.card').innerText()).includes('Last saved: today'));
  await shot('28-backup-saved', true);
  // where the phone has a Share menu that takes files, the file goes there instead
  await page.evaluate(() => { navigator.canShare = (d) => !!(d && d.files); navigator.share = async (d) => { window.__shared = { name: d.files[0].name, text: await d.files[0].text() }; }; });
  await tap('[data-act=save]');
  await page.waitForFunction(() => window.__shared);
  assert.deepEqual(await page.evaluate(() => window.__shared), { name: dl.suggestedFilename(), text: fileText });
  assert.ok((await page.locator('.note.ok').innerText()).includes('Shared.'));
  // a phone that will not copy by itself shows the text to copy by hand
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('no'); } }, configurable: true }); });
  await tap('[data-act=copy]');
  assert.equal(await page.locator('#out').inputValue(), fileText);
  await shot('29-backup-as-text', true);
  // a new phone: nothing saved yet
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto('about:blank');
  await page.goto(base);
  await page.waitForSelector('#find');
  await tap('a[href="#/backup"]');
  await page.waitForSelector('[data-act=pick]');
  // files that are not a backup are refused and nothing changes
  await tap('[data-act=paste]');
  for (const [text, says] of [['hello', 'could not be read'], ['{"app":"other","v":1,"state":{}}', 'not a backup from this app'], ['{"app":"civics128","v":2,"state":{}}', 'newer version']]) {
    await page.fill('#in', text);
    await tap('[data-act=check]');
    assert.ok((await page.locator('.note.bad').innerText()).includes(says), says);
    assert.equal(await page.locator('#in').inputValue(), text, 'a refused text stays in the box');
    assert.equal(await page.evaluate(() => localStorage['civics128.v1']), undefined, 'a refused file changes nothing');
  }
  await shot('30-backup-refused', true);
  // the real file: both sides are shown before anything changes
  await page.setInputFiles('#pick', file);
  await page.waitForSelector('.compare');
  const sides = await page.locator('.side').allInnerTexts();
  assert.ok(sides[0].replace(/\s+/g, ' ').includes(knownLine.replace(/\s+/g, ' ')), `the backup's side says ${knownLine}`);
  assert.ok(sides[0].includes('New Jersey') && sides[0].includes('3 days in a row'));
  assert.ok(sides[1].replace(/\s+/g, ' ').includes('0 of 128 known') && sides[1].includes('no state picked'));
  assert.equal(await page.evaluate(() => localStorage['civics128.v1']), undefined, 'looking at a backup changes nothing');
  await shot('31-backup-compare', true);
  await tap('[data-act=cancel]');
  await page.waitForSelector('[data-act=pick]');
  // pasted as text works the same way
  await tap('[data-act=paste]');
  await page.fill('#in', fileText);
  await tap('[data-act=check]');
  await page.waitForSelector('.compare');
  await tap('[data-act=replace]');
  await page.waitForSelector('.note.ok');
  assert.ok((await page.locator('.note.ok').innerText()).includes('Backup loaded'));
  assert.equal(await kept(), before, 'the loaded progress is the saved progress');
  await shot('32-backup-loaded', true);
  // undo puts back what the phone had (here: nothing), and the file can be loaded again
  await tap('[data-act=undo]');
  await page.waitForSelector('[data-act=putback]');
  const undoSides = await page.locator('.side').allInnerTexts();
  assert.ok(undoSides[0].replace(/\s+/g, ' ').includes('0 of 128 known') && undoSides[1].includes('New Jersey'), 'undo shows both sides first');
  assert.equal(await kept(), before, 'asking to undo changes nothing yet');
  await shot('32b-backup-undo-ask', true);
  await tap('[data-act=putback]');
  await page.waitForSelector('.note.ok');
  assert.ok((await page.locator('.note.ok').innerText()).includes('earlier progress back'));
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage['civics128.v1']).cards).length), 0);
  // the undo can itself be undone: nothing is ever dropped by one tap
  await tap('[data-act=undo]');
  await tap('[data-act=putback]');
  await page.waitForSelector('.note.ok');
  assert.equal(await kept(), before);
  // loading a second file says that the one kept copy will be dropped
  await page.setInputFiles('#pick', file);
  await page.waitForSelector('.compare');
  assert.ok((await page.locator('.content').innerText()).includes('keeps one earlier copy'));
  await tap('[data-act=replace]');
  await page.waitForSelector('.note.ok');
  assert.equal(await kept(), before);
  await page.goto(base + '#/');
  await page.waitForSelector('.hello');
  assert.equal((await page.locator('.known p').first().innerText()).trim(), knownLine);
  assert.ok((await page.locator('.streak').innerText()).includes('3 days in a row'));
  log(`${scheme}: a backup file is saved (download, Share menu, as text), refused when it is not one, compared, loaded on a "new phone" with the same progress, undone and loaded again`);

  // 8. the guide, in English and with Spanish
  await tap('.more a[href="#/guide"]');
  await page.waitForSelector('.step');
  assert.equal(await page.locator('.step').count(), 9);
  assert.equal(await page.locator('.step .es').count(), 0);
  assert.match(await page.locator('.video video').getAttribute('src'), /how-to-use-en\.mp4$/, 'the how-to video is on the guide');
  await shot('33-guide', true);
  await tap('[data-act=spanish]');
  assert.ok(await page.locator('.step p.es').count() >= 18);
  assert.match(await page.locator('.video video').getAttribute('src'), /how-to-use-es\.mp4$/, 'with Español open the video is the Spanish one');
  assert.ok((await page.locator('.card').innerText()).includes('borrador'));
  await shot('34-guide-spanish', true);
  await tap('[data-act=spanish]');
  await tap('a.x');
  await page.waitForSelector('.hello');
  log(`${scheme}: the guide opens with nine steps, Spanish one tap away and marked as a draft`);

  // 6. offline: with the network cut, the app still opens from the saved copy
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(800);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.hello');
  await page.goto(base + '#/study/symbols-A');
  await page.waitForSelector('.q');
  assert.ok(await page.evaluate(() => document.fonts.check('700 27px Fraunces')));
  await page.goto(base + '#/guide');
  await page.waitForSelector('.step');
  await page.goto(base + '#/backup');
  await page.waitForSelector('[data-act=save]');
  log(`${scheme}: opens and shows a study card, the guide and Backup with the network off`);
  await shot('20-offline-study');
  await ctx.setOffline(false);

  assert.deepEqual(errors, []);
  await ctx.close();
}

for (const scheme of ['light', 'dark']) await run(scheme);
await browser.close();
console.log('ALL OK');
