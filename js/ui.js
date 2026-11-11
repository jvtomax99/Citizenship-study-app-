// Shared pieces every screen uses: the scene header, the question card, the answers.
import { data, personalAnswers } from './data.js';
import { store } from './store.js';
import { canSpeak, speak } from './speak.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ICON = {
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  speaker: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
};

// The page frame: the Mall picture on top, the content over it.
export function frame(inner, { short = false } = {}) {
  return `<div class="scene${short ? ' short' : ''}"><picture>
      <source srcset="assets/images/mall-night.webp" media="(prefers-color-scheme: dark)">
      <img src="assets/images/mall-day.webp" alt="" width="1440" height="1075">
    </picture></div>
    <div class="content${short ? ' short' : ''}">${inner}</div>`;
}

// The top bar that floats on the sky: a round button, a gold bar, a pill.
export function topBar({ href, label, icon = ICON.close, done = 0, total = 0, barLabel = '', pills = [] }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="top">
    <a class="x" href="${href}" aria-label="${esc(label)}">${icon}</a>
    ${total ? `<div class="bar" role="progressbar" aria-label="${esc(barLabel)}" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}" style="--p:${pct}%"><i></i></div>` : '<div class="grow"></div>'}
    ${pills.length ? `<div class="tally">${pills.map((p) => `<b>${esc(p)}</b>`).join('')}</div>` : ''}
  </div>`;
}

const spanishFor = (q) => data.es[q.id] || null;
const draftMark = (es) => (es && es.checked ? '' : ' <span class="draft" title="Todavía no revisado">borrador</span>');

// The officer's card: chips, the eagle, the speaker, the question, the Español pill.
// spanish: false hides the Español pill (the mock interview is in English, like the real one).
export function questionCard(q, { chips = [], spanish = true } = {}) {
  const open = store.get().spanish;
  const es = spanish ? spanishFor(q) : null;
  return `<section class="card">
    <div class="chips">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}${q.star6520 ? '<span class="chip star">★ 65/20 list</span>' : ''}</div>
    <div class="officer">
      <img class="badge" src="assets/images/eagle-officer.webp" alt="" width="44" height="44">
      <span class="who">The officer asks</span>
      ${canSpeak() ? `<button class="speak" data-act="speak" aria-label="Hear the question">${ICON.speaker}</button>` : ''}
    </div>
    <p class="q">${esc(q.question)}</p>
    ${es ? `<button class="es-toggle" data-act="spanish" aria-expanded="${open}">Español <span aria-hidden="true">${open ? '▴' : '▾'}</span></button>
    ${open ? `<p class="es" lang="es">${esc(es.q)}${draftMark(es)}</p>` : ''}` : ''}
  </section>`;
}

function officialList(q) {
  const open = store.get().spanish;
  const es = open ? spanishFor(q) : null;
  return `<ul class="alist">${q.answers.map((a, i) => {
    const gloss = es && es.glosses && es.glosses[i];
    return `<li><span>${esc(a.text)}</span>
      ${es && es.a[i] ? `<i lang="es">${esc(es.a[i])}${gloss ? ` <span class="gloss">(${esc(gloss)})</span>` : ''}</i>` : ''}
      ${a.note ? `<small>${esc(a.note)}</small>` : ''}
      ${a.note && es && es.notes && es.notes[i] ? `<small lang="es" class="es-note">${esc(es.notes[i])}</small>` : ''}
    </li>`;
  }).join('')}</ul>`;
}

const NUMBER = { 2: 'two', 3: 'three', 5: 'five' };

// Every accepted answer, as USCIS wrote it. Personal answers (your senators, the
// President) go first, with where the name came from; the USCIS text stays below.
export function answersPanel(q) {
  const s = store.get();
  const { mine, ask } = personalAnswers(q, { place: s.place, typed: store.typedFor(s.place) });
  const optional = q.answers.some((a) => a.text.includes('('));
  let head;
  if (q.kind !== 'fixed') {
    const title = q.kind === 'current-official' ? 'The answer today' : (mine.length > 1 ? 'Your answer (say one)' : 'Your answer');
    head = `<h2 class="label">${title}</h2>
      ${mine.map((m) => `<div class="mine"><p>${esc(m.text)}</p>${m.caption ? `<small>${esc(m.caption)}</small>` : ''}</div>`).join('')}
      ${ask === 'place' ? '<p class="hint">This answer depends on where you live.</p><a class="btn ghost small" href="#/place">Pick your state</a>' : ''}
      ${ask === 'typed' ? '<p class="hint">This name is not filled in yet.</p><a class="btn ghost small" href="#/place">Add the name</a>' : ''}
      <h2 class="label second">What USCIS says</h2>`;
  } else if (q.need > 1) {
    head = `<h2 class="label">Say ${NUMBER[q.need] || q.need}. The officer accepts any ${NUMBER[q.need] || q.need} of these</h2>`;
  } else {
    head = `<h2 class="label">${q.answers.length > 1 ? 'The officer accepts any one of these' : 'The officer accepts'}</h2>`;
  }
  return `<section class="answers">${head}${officialList(q)}
    ${optional ? '<p class="hint">Words in parentheses are optional.</p>' : ''}</section>`;
}

// The Español pill on a question card: open or close the Spanish text.
export const toggleSpanish = (rerender) => () => { store.set({ spanish: !store.get().spanish }); rerender(); };

// Buttons and links marked data-act="name" call handlers[name]. Returns nothing.
export function wire(root, handlers, q) {
  const drawn = performance.now();
  root.onclick = (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    // a double tap must not press the button that just appeared under the finger
    if (e.isTrusted && performance.now() - drawn < 300 && el.dataset.act !== 'speak') return;
    const act = el.dataset.act;
    if (act === 'speak' && q) { if (handlers.speak) handlers.speak(el); return speak(q().question, el); }
    if (handlers[act]) handlers[act](el, e);
  };
}

// The press: buttons sink for a moment even on a quick tap (DESIGN.md, Press).
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn');
  if (!b) return;
  b.classList.add('is-pressed');
  setTimeout(() => b.classList.remove('is-pressed'), 260);
});
