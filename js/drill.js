// Drill: the officer asks, you answer out loud, show the answers, then say how it went.
// Missed and guessed questions come back later in the round and stay due (js/srs.js).
import { data, idsInList } from './data.js';
import { metOn, streak } from './progress.js';
import { LANDMARKS } from './mall.js';
import { store } from './store.js';
import { buildRound, grade, requeue, isMiss, dayNumber, MAX_RETRIES } from './srs.js';
import { stopSpeaking } from './speak.js';
import { frame, topBar, questionCard, answersPanel, wire, toggleSpanish, eagleHeader } from './ui.js';

let round = null; // {queue, total, asked: Set, retries: {}, tally: {knew, guessed, missed}, shown, list, part, goalHit}

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// part: a section key like 'history-B' drills only that part (from the Mall); '' = everything.
const partOf = (arg) => data.sections.find((x) => x.key === arg) || null;

function start(part = '') {
  const s = store.get();
  const sec = partOf(part);
  const queue = buildRound(idsInList(s.list, sec ? sec.ids : undefined), s.cards, dayNumber(), { shuffle });
  round = { queue, total: queue.length, asked: new Set(), retries: {}, tally: { knew: 0, guessed: 0, missed: 0 }, shown: false, list: s.list, part: sec ? sec.key : '', goalHit: false };
}

function answer(result) {
  const id = round.queue[0];
  const retry = round.asked.has(id);
  const cards = { ...store.get().cards };
  cards[id] = grade(cards[id], result, dayNumber(), { retry });
  store.set({ cards });
  if (!retry) { // the tally and the daily goal count each question's first answer
    round.tally[result]++;
    const today = dayNumber();
    const before = metOn(store.get().days, today);
    if (!before && metOn(store.countAnswer().days, today)) round.goalHit = true;
  }
  round.asked.add(id);
  let rest = round.queue.slice(1);
  if (isMiss(result) && (round.retries[id] || 0) < MAX_RETRIES) {
    round.retries[id] = (round.retries[id] || 0) + 1;
    rest = requeue(rest, id);
  }
  round.queue = rest;
  round.shown = false;
}

function results(root, rerender) {
  const { knew, guessed, missed } = round.tally;
  const back = guessed + missed;
  const s = store.get();
  const today = dayNumber();
  const run = streak(s.days, today).count;
  const home = round.part ? '#/mall' : '#/';
  root.innerHTML = frame(`
    ${topBar({ href: home, label: round.part ? 'The Mall' : 'Home', done: round.total, total: round.total, barLabel: 'Round finished' })}
    <section class="card">
      ${eagleHeader('Round finished', knew === round.total ? 'You knew them all!' : `You knew ${knew} of ${round.total}`)}
      <div class="score">
        <div class="good"><b>${knew}</b><span>knew it</span></div>
        <div><b>${guessed}</b><span>guessed</span></div>
        <div><b>${missed}</b><span>missed</span></div>
      </div>
      <p class="lead">${back ? `The ${back} you guessed or missed ${back === 1 ? 'comes' : 'come'} back first in your next round.` : 'These come back in a few days, so they stay fresh.'}</p>
      ${round.goalHit ? `<p class="goal-hit"><b>★ Goal reached.</b> ${run} day${run === 1 ? '' : 's'} in a row.</p>`
        : metOn(s.days, today) ? '' : `<p class="hint">Today: ${s.days[today]?.n || 0} of ${s.goal} questions.</p>`}
    </section>
    <div class="spacer"></div>
    <div class="actions">
      <button class="btn primary" data-act="again">Another round</button>
      <a class="btn ghost" href="${home}">${round.part ? 'Back to the Mall' : 'Home'}</a>
    </div>`);
  wire(root, { again: () => { start(round.part); rerender(); window.scrollTo(0, 0); } });
}

export function drill(root, arg, rerender) {
  const part = partOf(arg) ? arg : '';
  if (!round || round.list !== store.get().list || round.part !== part) start(part);
  if (!round.queue.length) return results(root, rerender);

  const q = data.byId[round.queue[0]];
  const again = round.asked.has(q.id);
  const done = round.asked.size;
  root.innerHTML = frame(`
    ${topBar({ href: round.part ? '#/mall' : '#/', label: 'Leave the drill', done, total: round.total, barLabel: `${done} of ${round.total} questions answered`, pills: [`✓ ${round.tally.knew}`, `✕ ${round.tally.guessed + round.tally.missed}`] })}
    ${questionCard(q, { chips: [again ? 'Once more' : `${round.part && LANDMARKS[round.part] ? LANDMARKS[round.part].name : 'Drill'} · ${Math.min(done + 1, round.total)} of ${round.total}`] })}
    ${round.shown ? answersPanel(q) : '<p class="say">Say your answer out loud, then check it.</p>'}
    <div class="spacer"></div>
    <div class="actions">${round.shown ? `
      <button class="btn primary" data-act="grade" data-result="knew">I knew it</button>
      <div class="pair">
        <button class="btn ghost" data-act="grade" data-result="guessed">I guessed</button>
        <button class="btn ghost" data-act="grade" data-result="missed">I missed it</button>
      </div>` : '<button class="btn primary" data-act="show">Show answers</button>'}
    </div>`);

  wire(root, {
    show: () => { round.shown = true; rerender(); },
    grade: (el) => { stopSpeaking(); answer(el.dataset.result); rerender(); window.scrollTo(0, 0); },
    spanish: toggleSpanish(rerender),
  }, () => q);
}

// A finished round should not greet you again when you come back from Home.
export function leaveDrill() { if (round && !round.queue.length) round = null; else if (round) round.shown = false; }
