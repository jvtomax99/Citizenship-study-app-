// Home: the state chip, how much is known, the two big buttons, the sections.
import { idsInList, placeByCode } from './data.js';
import { store } from './store.js';
import { isKnown, dayNumber, ROUND_SIZE } from './srs.js';
import { standing } from './match.js';
import { esc, frame, wire, eagleHeader, ICON } from './ui.js';
import { GOALS, answeredOn, metOn, streak, week } from './progress.js';
import { mallRows, mallStrip } from './mall.js';

let installEvent = null; // Android and desktop Chrome offer a real install prompt
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
let pickingGoal = false; // the 5 / 10 / 20 choice is open

const DOT = { met: 'Goal reached', rest: 'Rest day', some: 'Some questions', none: 'No questions' };

// Today's goal, the last seven days and the streak.
function todayPanel(s, today) {
  const n = answeredOn(s.days, today);
  const met = metOn(s.days, today);
  const run = streak(s.days, today).count;
  return `<section class="today" aria-label="Today">
    <div class="today-head">
      <h2 class="label">Today</h2>
      <span class="streak${run ? ' on' : ''}" aria-label="${run} day${run === 1 ? '' : 's'} in a row">★ ${run} day${run === 1 ? '' : 's'} in a row</span>
    </div>
    <p><b>${Math.min(n, s.goal)} of ${s.goal}</b> questions${met ? ' · goal reached' : ''}</p>
    <div class="meter" role="progressbar" aria-label="${n} of ${s.goal} questions today" aria-valuenow="${Math.min(n, s.goal)}" aria-valuemin="0" aria-valuemax="${s.goal}" style="--p:${Math.min(100, Math.round((n / s.goal) * 100))}%"><i></i></div>
    <div class="week">${week(s.days, today).map((d) => `<span class="day ${d.state}${d.today ? ' now' : ''}" role="img" aria-label="${d.name}${d.today ? ' (today)' : ''}: ${DOT[d.state].toLowerCase()}"><i>${d.state === 'met' ? '★' : d.state === 'rest' ? '·' : ''}</i>${d.letter}</span>`).join('')}</div>
    ${pickingGoal ? `<div class="seg" role="group" aria-label="Questions a day">${GOALS.map((g) => `<button data-act="goal" data-goal="${g}" aria-pressed="${s.goal === g}">${g} a day</button>`).join('')}</div>
      <p class="hint">A day counts when you reach your goal in the drill or the interview. One missed day a week is a rest day and keeps your days in a row.</p>`
      : `<button class="link" data-act="pickgoal">Goal: ${s.goal} questions a day · change</button>`}
  </section>`;
}

export function home(root, _arg, rerender) {
  const s = store.get();
  const place = placeByCode(s.place);
  const ids = idsInList(s.list);
  const known = ids.filter((id) => isKnown(s.cards[id])).length;
  const today = dayNumber();
  const waiting = ids.filter((id) => s.cards[id] && s.cards[id].box === 0 && s.cards[id].seen && s.cards[id].due <= today).length;
  const rows = mallRows(s.list, s.cards);
  const round = Math.min(ROUND_SIZE, ids.length);
  const going = s.mock && !standing(s.mock.log, s.mock.list).over;
  const lastMock = (s.mockHistory || []).at(-1);

  root.innerHTML = frame(`
    <div class="top">
      <a class="pill-link" href="#/place">${place ? esc(place.name) : 'Pick your state'} ${ICON.chevron}</a>
      <div class="grow"></div>
    </div>
    <section class="card hello">
      ${eagleHeader('U.S. civics test · 2025', 'Ready to study?')}
      <div class="seg" role="group" aria-label="Which questions">
        <button data-act="list" data-list="all" aria-pressed="${s.list === 'all'}">All 128</button>
        <button data-act="list" data-list="6520" aria-pressed="${s.list === '6520'}">★ 65/20 list (20)</button>
      </div>
      <div class="known">
        <p><b>${known} of ${ids.length}</b> known</p>
        <div class="meter" role="progressbar" aria-label="${known} of ${ids.length} questions known" aria-valuenow="${known}" aria-valuemin="0" aria-valuemax="${ids.length}" style="--p:${Math.round((known / ids.length) * 100)}%"><i></i></div>
        <p class="hint">${waiting ? `${waiting} missed question${waiting === 1 ? ' is' : 's are'} waiting for you.` : 'Known means you knew it the last time it was asked.'}</p>
      </div>
    </section>

    ${todayPanel(s, today)}

    <a class="btn primary" href="#/drill">Drill · ${round} questions</a>
    <a class="btn ghost" href="#/mock">${going ? `Continue the interview · ${s.mock.log.length} answered` : 'Mock interview'}</a>
    <a class="btn ghost" href="#/study">Study cards</a>
    ${lastMock ? `<p class="hint center">Last interview${lastMock.list === '6520' ? ' (65/20)' : ''}: ${lastMock.passed ? 'passed' : 'not yet'}, ${lastMock.right} right and ${lastMock.wrong} wrong.</p>` : ''}

    ${!installed() && !s.hideInstallTip ? `<aside class="tip">
      <p><b>Keep your progress safe.</b> ${isIos() ? 'Tap the Share button, then “Add to Home Screen”.' : 'Add this app to your Home Screen.'} It also opens without internet.</p>
      <div>${installEvent ? '<button class="btn ghost small" data-act="install">Install</button>' : ''}<button class="btn ghost small" data-act="hidetip">Got it</button></div>
    </aside>` : ''}

    ${mallStrip(rows)}
    <p class="fine">The questions and answers are copied word for word from USCIS (form M-1778, 09/25). This app is not made by USCIS.</p>
  `);

  wire(root, {
    pickgoal: () => { pickingGoal = true; rerender(); },
    goal: (el) => { store.setGoal(Number(el.dataset.goal)); pickingGoal = false; rerender(); },
    list: (el) => { store.set({ list: el.dataset.list }); rerender(); },
    hidetip: () => { store.set({ hideInstallTip: true }); rerender(); },
    install: () => { if (installEvent) { installEvent.prompt(); installEvent = null; } },
  });
}
