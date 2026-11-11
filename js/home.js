// Home: the state chip, how much is known, the two big buttons, the sections.
import { data, idsInList, placeByCode } from './data.js';
import { store } from './store.js';
import { isKnown, dayNumber, ROUND_SIZE } from './srs.js';
import { standing } from './match.js';
import { esc, frame, wire, ICON } from './ui.js';

let installEvent = null; // Android and desktop Chrome offer a real install prompt
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function sectionRows(list, cards) {
  return data.sections.map((s) => {
    const ids = idsInList(list, s.ids);
    return { ...s, ids, known: ids.filter((id) => isKnown(cards[id])).length };
  }).filter((s) => s.ids.length);
}

export function home(root, _arg, rerender) {
  const s = store.get();
  const place = placeByCode(s.place);
  const ids = idsInList(s.list);
  const known = ids.filter((id) => isKnown(s.cards[id])).length;
  const today = dayNumber();
  const waiting = ids.filter((id) => s.cards[id] && s.cards[id].box === 0 && s.cards[id].seen && s.cards[id].due <= today).length;
  const rows = sectionRows(s.list, s.cards);
  const round = Math.min(ROUND_SIZE, ids.length);
  const going = s.mock && !standing(s.mock.log, s.mock.list).over;
  const lastMock = (s.mockHistory || []).at(-1);
  let group = '';

  root.innerHTML = frame(`
    <div class="top">
      <a class="pill-link" href="#/place">${place ? esc(place.name) : 'Pick your state'} ${ICON.chevron}</a>
      <div class="grow"></div>
    </div>
    <section class="card hello">
      <div class="officer">
        <img class="badge big" src="assets/images/eagle-officer.webp" alt="" width="64" height="64">
        <div>
          <span class="who">U.S. civics test · 2025</span>
          <h1 class="title">Ready to study?</h1>
        </div>
      </div>
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

    <a class="btn primary" href="#/drill">Drill · ${round} questions</a>
    <a class="btn ghost" href="#/mock">${going ? `Continue the interview · ${s.mock.log.length} answered` : 'Mock interview'}</a>
    <a class="btn ghost" href="#/study">Study cards</a>
    ${lastMock ? `<p class="hint center">Last interview${lastMock.list === '6520' ? ' (65/20)' : ''}: ${lastMock.passed ? 'passed' : 'not yet'}, ${lastMock.right} right and ${lastMock.wrong} wrong.</p>` : ''}

    ${!installed() && !s.hideInstallTip ? `<aside class="tip">
      <p><b>Keep your progress safe.</b> ${isIos() ? 'Tap the Share button, then “Add to Home Screen”.' : 'Add this app to your Home Screen.'} It also opens without internet.</p>
      <div>${installEvent ? '<button class="btn ghost small" data-act="install">Install</button>' : ''}<button class="btn ghost small" data-act="hidetip">Got it</button></div>
    </aside>` : ''}

    <h2 class="label section-head">Sections</h2>
    <div class="rows">${rows.map((r) => {
      const head = r.group !== group ? `<h3 class="group">${esc(group = r.group)}</h3>` : '';
      return `${head}<a class="row" href="#/study/${r.key}">
        <span class="row-main"><b>${esc(r.title)}</b>
          <span class="meter thin" style="--p:${Math.round((r.known / r.ids.length) * 100)}%"><i></i></span></span>
        <span class="row-count">${r.known}/${r.ids.length}</span>${ICON.chevron}
      </a>`;
    }).join('')}</div>
    <p class="fine">The questions and answers are copied word for word from USCIS (form M-1778, 09/25). This app is not made by USCIS.</p>
  `);

  wire(root, {
    list: (el) => { store.set({ list: el.dataset.list }); rerender(); },
    hidetip: () => { store.set({ hideInstallTip: true }); rerender(); },
    install: async () => { if (installEvent) { installEvent.prompt(); installEvent = null; } },
  });
}
