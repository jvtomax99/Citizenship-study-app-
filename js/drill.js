// Drill: the officer asks, you answer out loud, show the answers, then say how it went.
// Missed and guessed questions come back later in the round and stay due (js/srs.js).
import { data, idsInList } from './data.js';
import { store } from './store.js';
import { buildRound, grade, requeue, isMiss, dayNumber, MAX_RETRIES } from './srs.js';
import { stopSpeaking } from './speak.js';
import { frame, topBar, questionCard, answersPanel, wire, toggleSpanish, ICON } from './ui.js';

let round = null; // {queue, total, asked: Set, retries: {}, tally: {knew, guessed, missed}, shown}

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function start() {
  const s = store.get();
  const queue = buildRound(idsInList(s.list), s.cards, dayNumber(), { shuffle });
  round = { queue, total: queue.length, asked: new Set(), retries: {}, tally: { knew: 0, guessed: 0, missed: 0 }, shown: false, list: s.list };
}

function answer(result) {
  const id = round.queue[0];
  const retry = round.asked.has(id);
  const cards = { ...store.get().cards };
  cards[id] = grade(cards[id], result, dayNumber(), { retry });
  store.set({ cards });
  if (!retry) round.tally[result]++; // the tally counts each question's first answer
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
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Home', done: round.total, total: round.total, barLabel: 'Round finished' })}
    <section class="card">
      <div class="officer">
        <img class="badge big" src="assets/images/eagle-officer.webp" alt="" width="64" height="64">
        <div><span class="who">Round finished</span>
        <h1 class="title">${knew === round.total ? 'You knew them all!' : `You knew ${knew} of ${round.total}`}</h1></div>
      </div>
      <div class="score">
        <div class="good"><b>${knew}</b><span>knew it</span></div>
        <div><b>${guessed}</b><span>guessed</span></div>
        <div><b>${missed}</b><span>missed</span></div>
      </div>
      <p class="lead">${back ? `The ${back} you guessed or missed ${back === 1 ? 'comes' : 'come'} back first in your next round.` : 'These come back in a few days, so they stay fresh.'}</p>
    </section>
    <div class="spacer"></div>
    <div class="actions">
      <button class="btn primary" data-act="again">Another round</button>
      <a class="btn ghost" href="#/">Home</a>
    </div>`);
  wire(root, { again: () => { start(); rerender(); window.scrollTo(0, 0); } });
}

export function drill(root, _arg, rerender) {
  if (!round || round.list !== store.get().list) start();
  if (!round.queue.length) return results(root, rerender);

  const q = data.byId[round.queue[0]];
  const again = round.asked.has(q.id);
  const done = round.asked.size;
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Leave the drill', done, total: round.total, barLabel: `${done} of ${round.total} questions answered`, pills: [`✓ ${round.tally.knew}`, `✕ ${round.tally.guessed + round.tally.missed}`] })}
    ${questionCard(q, { chips: [again ? 'Once more' : `Drill · ${Math.min(done + 1, round.total)} of ${round.total}`] })}
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
