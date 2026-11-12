// Study cards: flip through a section, hear the question, show the answers.
import { data, idsInList, sectionRows } from './data.js';
import { store } from './store.js';
import { stopSpeaking } from './speak.js';
import { frame, topBar, questionCard, answersPanel, wire, toggleSpanish, sectionLinks, ICON } from './ui.js';

const at = {}; // where you were in each section, while the app stays open
let shown = false;

function listView(root) {
  const s = store.get();
  const all = idsInList(s.list);
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Home', icon: ICON.back })}
    <section class="card">
      <span class="who">Study cards</span>
      <h1 class="title">Pick a section</h1>
      <p class="lead">${s.list === '6520' ? 'Showing the 20 questions of the 65/20 list.' : 'All 128 questions, in the order USCIS prints them.'}</p>
    </section>
    <div class="rows">
      <a class="row" href="#/study/all"><span class="row-main"><b>${s.list === '6520' ? 'The whole 65/20 list' : 'All questions'}</b></span><span class="row-count">${all.length}</span>${ICON.chevron}</a>
      ${sectionLinks(sectionRows(s.list, s.cards))}
    </div>`, { short: true });
  root.onclick = null;
}

export function study(root, key, rerender) {
  if (!key) return listView(root);
  const s = store.get();
  const section = data.sections.find((x) => x.key === key);
  const ids = idsInList(s.list, key === 'all' ? undefined : section ? section.ids : []);
  if (!ids.length) { location.replace('#/study'); return; }
  const slot = s.list + ':' + key;
  const i = Math.min(at[slot] || 0, ids.length - 1);
  const q = data.byId[ids[i]];
  const go = (n) => { at[slot] = n; shown = false; stopSpeaking(); rerender(); window.scrollTo(0, 0); };

  root.innerHTML = frame(`
    ${topBar({ href: '#/study', label: 'Back to sections', icon: ICON.back, done: i + 1, total: ids.length, barLabel: `Card ${i + 1} of ${ids.length}`, pills: [`${i + 1} / ${ids.length}`] })}
    ${questionCard(q, { chips: [`Question ${q.id}`, section ? section.title : q.partTitle] })}
    ${shown ? answersPanel(q) : ''}
    <div class="spacer"></div>
    <div class="actions two">
      <button class="btn ghost" data-act="prev" ${i === 0 ? 'disabled' : ''} aria-label="Previous card">Back</button>
      ${shown
        ? (i < ids.length - 1 ? '<button class="btn primary" data-act="next">Next</button>' : '<button class="btn primary" data-act="done">Done</button>')
        : '<button class="btn primary" data-act="show">Show answers</button>'}
    </div>`);

  wire(root, {
    show: () => { shown = true; rerender(); },
    next: () => go(i + 1),
    done: () => { at[slot] = 0; location.hash = '#/study'; },
    prev: () => go(i - 1),
    spanish: toggleSpanish(rerender),
  }, () => q);
}

// Opening a section starts with the answers hidden.
export function leaveStudy() { shown = false; }
