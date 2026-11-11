/* Screenshots of the real app for the how-to video, at iPhone size (390 x 844, 2x).
   Start a server at the repo root (python3 -m http.server 8123), then: node promo/tools/capture.cjs
   Writes promo/public/shots/*.png and promo/src/layout.json (where the buttons are, in screenshot
   pixels, so the video's taps and highlights follow the app). The learner is made up: New Jersey,
   73 of 128 known, four landmarks lit, five days in a row, one passed interview. */
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const OUT = path.resolve('promo/public/shots');
fs.mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || 'http://localhost:8123/';
const bank = JSON.parse(fs.readFileSync('data/questions.json', 'utf8')).questions;
const byText = Object.fromEntries(bank.map((q) => [q.question, q]));
const TAP = 330; // the app ignores a second tap within 300 ms of a new screen

function seed(today) {
  const part = (k) => bank.filter((q) => `${q.section}-${q.part}` === k).map((q) => q.id);
  const cards = {};
  const know = (ids, box) => ids.forEach((id) => { cards[id] = { box, due: today + 3, seen: box + 1, last: 'knew' }; });
  for (const k of ['government-A', 'history-B', 'symbols-A', 'symbols-B']) know(part(k), 3);
  know(part('government-B').slice(0, 20), 1); know(part('history-A').slice(0, 9), 1);
  know(part('history-C').slice(0, 5), 1); know(part('government-C').slice(0, 4), 1);
  for (const id of part('history-A').slice(9, 11)) cards[id] = { box: 0, due: today, seen: 2, last: 'missed' };
  const days = {};
  for (const d of [1, 2, 4, 5, 6]) days[today - d] = { n: 10, g: 10 };
  days[today] = { n: 6, g: 10, ids: [] };
  return { v: 1, place: 'NJ', typed: {}, list: 'all', cards, spanish: false, skippedPlace: false, hideInstallTip: true, mock: null,
    mockHistory: [{ day: today - 2, list: 'all', right: 12, wrong: 4, passed: true }], goal: 10, days, lastBackup: today - 3 };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    window.speechSynthesis.speak = () => {};
    class Hear { start() { setTimeout(() => { this.onresult({ results: [[{ transcript: window.__hear || '' }]] }); this.onend(); }, 150); } abort() { if (this.onend) this.onend(); } }
    window.SpeechRecognition = Hear; window.webkitSpeechRecognition = Hear;
  });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  const layout = {};
  const pageH = () => p.evaluate(() => Math.round(document.documentElement.scrollHeight * 2));
  /* name -> selector; a missing one is an error, so a renamed button is noticed here and not in the video */
  const rr = async (m) => {
    const out = await p.evaluate((m) => Object.fromEntries(Object.entries(m).map(([k, s]) => {
      const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length);
      if (!e) return [k, null];
      const b = e.getBoundingClientRect();
      return [k, [Math.round(b.x * 2), Math.round((b.y + scrollY) * 2), Math.round(b.width * 2), Math.round(b.height * 2)]];
    })), m);
    for (const k in out) if (!out[k]) throw new Error(`not on the screen: ${k} (${m[k]})`);
    return out;
  };
  const shot = async (name, m = {}) => {
    await p.waitForTimeout(450);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    layout[name] = Object.assign(await rr(m), { h: await pageH() });
    console.log('shot', name, layout[name].h);
  };
  const tap = async (sel) => { await p.waitForTimeout(TAP); await p.click(sel); };
  const go = async (hash, wait) => { await p.goto('about:blank'); await p.goto(base + hash); await p.waitForSelector(wait); };

  await p.goto(base);
  await p.waitForSelector('#find, .hello');
  const today = await p.evaluate(() => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); });
  await p.evaluate((s) => { localStorage.setItem('civics128.v1', s); }, JSON.stringify(seed(today)));

  await go('#/', '.hello');
  await shot('home', { place: '.pill-link', all: '[data-list="all"]', star: '[data-list="6520"]', known: '.known', today: '.today', streak: '.streak', week: '.week',
    drill: 'a.btn[href="#/drill"]', mock: 'a.btn[href="#/mock"]', study: 'a.btn[href="#/study"]', strip: '.strip', backup: 'a.row[href="#/backup"]', guide: 'a.row[href="#/guide"]' });

  /* the state: the New Jersey page, then the picker with "new j" typed */
  await go('#/place', '#rep');
  await shot('place-nj', { card: '.card', rep: '#rep', save: '[data-act=save]' });
  await tap('[data-act=change]');
  await p.waitForSelector('#find');
  await shot('place-list', { find: '#find' });
  await p.fill('#find', 'new j');
  await shot('place-find', { find: '#find', row: '#places .row:not([hidden])' });

  /* study cards: the parts, a question, its answers, the Spanish */
  await go('#/study', '.rows .row');
  await shot('study-parts', { row: 'a.row[href="#/study/government-A"]' });
  await tap('a.row[href="#/study/government-A"]');
  await p.waitForSelector('.q');
  await shot('study-q', { speak: '[data-act=speak]', spanish: '[data-act=spanish]', show: '[data-act=show]', q: '.q' });
  await tap('[data-act=show]');
  await shot('study-a', { answers: '.answers', spanish: '[data-act=spanish]' });
  await tap('[data-act=spanish]');
  await shot('study-es', { es: '.es', answers: '.answers' });
  await tap('[data-act=spanish]');

  /* drill: the question, then the answers with the three honest buttons */
  await go('#/drill', '[data-act=show]');
  await shot('drill-q', { show: '[data-act=show]', q: '.q' });
  await tap('[data-act=show]');
  await shot('drill-a', { answers: '.answers', knew: '[data-result=knew]', guessed: '[data-result=guessed]', missed: '[data-result=missed]' });

  /* the 65/20 list on Home */
  await go('#/', '.hello');
  await tap('[data-list="6520"]');
  await shot('home-6520', { star: '[data-list="6520"]', known: '.known' });
  await tap('[data-list="all"]');

  /* the Mall and the backup screen */
  await go('#/mall', '.stop');
  await shot('mall', { lincoln: '.stop:has([data-key="history-B"])', archives: '.stop:has([data-key="government-A"])', capitol: '.stop:has([data-key="government-B"])', card: '.card' });
  await go('#/backup', '[data-act=save]');
  await shot('backup', { save: '[data-act=save]', card: '.card' });

  /* mock interview: start again until the first question has one fixed answer, type it, pass with 12 */
  await go('#/mock', '[data-act=fresh]');
  await shot('mock-start', { fresh: '[data-act=fresh]' });
  let q;
  for (let i = 0; i < 20; i++) {
    await tap('[data-act=fresh]');
    await p.waitForSelector('#answer');
    q = byText[await p.locator('.q').innerText()];
    if (q.kind === 'fixed' && q.need === 1 && q.question.length < 70) break;
    await p.evaluate(() => { const s = JSON.parse(localStorage['civics128.v1']); s.mock = null; localStorage['civics128.v1'] = JSON.stringify(s); });
    await go('#/mock', '[data-act=fresh]');
  }
  const right = (q) => q.answers.slice(0, q.need).map((a) => a.text.replace(/\(\d+\)/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()).join(', ');
  await shot('mock-q', { q: '.q', answer: '#answer', mic: '[data-act=mic]', check: '[data-act=check]', road: '.road' });
  await p.fill('#answer', right(q));
  await shot('mock-typed', { answer: '#answer', check: '[data-act=check]' });
  await tap('[data-act=check]');
  await p.waitForSelector('.sheet.right');
  await shot('mock-right', { sheet: '.sheet', next: '[data-act=next]' });
  await tap('[data-act=next]');
  for (let i = 0; i < 11; i++) {
    q = byText[await p.locator('.q').innerText()];
    await p.fill('#answer', q.kind === 'fixed' ? right(q) : 'Somebody Unknown');
    await tap('[data-act=check]');
    await p.waitForSelector('.sheet');
    if (await p.locator('[data-verdict]').count()) await tap('[data-verdict=right]');
    else if (!(await p.locator('.sheet.right').count())) await tap('[data-act=flip]');
    await p.waitForSelector('.sheet.right');
    if (i === 9) await shot('mock-11', { road: '.road' });
    await tap('[data-act=next]');
  }
  await p.waitForSelector('.review');
  await shot('mock-pass', { title: '.title', score: '.score' });

  fs.writeFileSync(path.resolve('promo/src/layout.json'), JSON.stringify(layout) + '\n');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
