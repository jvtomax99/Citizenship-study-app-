// The National Mall: one landmark per USCIS part. A landmark brightens with each question
// known and turns gold when every question was known on two different days (js/progress.js).
import { sectionRows } from './data.js';
import { store } from './store.js';
import { landmark } from './progress.js';
import { esc, frame, topBar, wire, ICON } from './ui.js';

// Section key (js/data.js) -> the landmark that stands for it. Pictures: CREDITS.md.
export const LANDMARKS = {
  'government-A': { name: 'National Archives', img: 'archives' },
  'government-B': { name: 'The Capitol', img: 'capitol' },
  'government-C': { name: 'Supreme Court', img: 'court' },
  'history-A': { name: 'Washington Monument', img: 'monument' },
  'history-B': { name: 'Lincoln Memorial', img: 'lincoln' },
  'history-C': { name: 'World War II Memorial', img: 'ww2' },
  'symbols-A': { name: 'The flag', img: 'flag' },
  'symbols-B': { name: 'Fireworks over the Mall', img: 'fireworks' },
};

// The parts in the chosen list, each with its landmark and its light.
export function mallRows(list, cards) {
  return sectionRows(list, cards).filter((r) => LANDMARKS[r.key])
    .map((r) => ({ ...r, ...LANDMARKS[r.key], ...landmark(r.ids, cards) }));
}

const src = (r) => `assets/images/landmarks/${r.img}.webp`;
const light = (r) => `--l:${r.light.toFixed(2)}`;

// "12 of 17 known", and what is still needed for the gold.
function status(r) {
  if (r.lit) return `All ${r.total} known on two different days`;
  if (r.known === r.total) return `All ${r.total} known once. Know them again another day to light it`;
  return `${r.known} of ${r.total} known`;
}

// The small row of round landmarks on Home.
export function mallStrip(rows) {
  const lit = rows.filter((r) => r.lit).length;
  return `<a class="strip" href="#/mall" aria-label="The National Mall: ${lit} of ${rows.length} landmarks lit">
    <span class="strip-head"><b>The National Mall</b><span>${lit} of ${rows.length} lit</span>${ICON.chevron}</span>
    <span class="strip-row">${rows.map((r) => `<i class="thumb${r.lit ? ' lit' : ''}" style="${light(r)}"><img src="assets/images/landmarks/${r.img}-s.webp" alt="" width="36" height="36"></i>`).join('')}</span>
  </a>`;
}

let open = ''; // the landmark whose buttons are showing

export function mall(root, _arg, rerender) {
  const s = store.get();
  const rows = mallRows(s.list, s.cards);
  const lit = rows.filter((r) => r.lit).length;
  let group = '';
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Home', icon: ICON.back, done: lit, total: rows.length, barLabel: `${lit} of ${rows.length} landmarks lit`, pills: [`★ ${lit} of ${rows.length}`] })}
    <section class="card">
      <span class="who">The National Mall</span>
      <h1 class="title">${lit === rows.length ? 'Every landmark is lit' : 'Light up the Mall'}</h1>
      <p class="lead">Each landmark gets brighter as you know its questions${s.list === '6520' ? ' (the 65/20 list)' : ''}. It turns gold when you have known them all on two different days, and dims if you miss one.</p>
    </section>
    <div class="stops">${rows.map((r, i) => {
      const head = r.group !== group ? `<h2 class="group">${esc(group = r.group)}</h2>` : '';
      const on = open === r.key;
      return `${head}<div class="stop${r.lit ? ' lit' : ''}${on ? ' is-on' : ''}" style="${light(r)}">
        <button class="stop-pic" data-act="open" data-key="${r.key}" aria-expanded="${on}">
          <img src="${src(r)}" alt="" width="720" height="538"${i > 1 ? ' loading="lazy"' : i ? '' : ' fetchpriority="high"'}>
          ${r.lit ? '<i class="lit-badge">★ Lit</i>' : ''}
          <span class="stop-cap"><b>${esc(r.name)}</b><span>${esc(r.title)}</span>
            <span class="meter thin" style="--p:${Math.round(r.light * 100)}%"><i></i></span>
            <span>${status(r)}</span></span>
        </button>
        ${on ? `<div class="stop-acts">
          <a class="btn primary" href="#/drill/${r.key}">Drill this part</a>
          <a class="btn ghost" href="#/study/${r.key}">Study cards</a>
        </div>` : ''}
      </div>`;
    }).join('')}</div>`, { short: true });

  wire(root, { open: (el) => { open = open === el.dataset.key ? '' : el.dataset.key; rerender(); root.querySelector(`[data-key="${el.dataset.key}"]`)?.focus({ preventScroll: true }); } });
}

export function leaveMall() { open = ''; }
