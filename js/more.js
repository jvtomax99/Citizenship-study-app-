// Two small screens opened from the bottom of Home:
//   #/backup  save everything the phone remembers to a file, and load such a file
//   #/guide   how to use this app, in English with Spanish help
// The checking of a backup file is in js/backup.js; this file is only the screens.
import { data, placeByCode } from './data.js';
import { store } from './store.js';
import { dayNumber } from './srs.js';
import { pack, unpack, summary, ago, fileName, MAX_BYTES } from './backup.js';
import { esc, frame, topBar, eagleHeader, wire, toggleSpanish, ICON } from './ui.js';

// ---- backup ----

const NOTE = 'civics128.note'; // one line to show after the page reloads (this tab only)
const WHY = {
  damaged: 'This file could not be read. It may be damaged or cut short. Nothing was changed.',
  other: 'This is not a backup from this app. Nothing was changed.',
  newer: 'This backup was made by a newer version of the app. Open the app with internet once to update it, then try again. Nothing was changed.',
  big: 'This file is too big to be a backup from this app. Nothing was changed.',
  full: 'This phone could not save the backup (its storage is full or blocked). Nothing was changed.',
};

let pending = null;  // progress waiting for a yes: {state, saved} from a file, or {state, back: true} (the kept copy)
let pasted = '';     // what is in the paste box, so a refused text is not lost
let note = null;     // {kind: 'ok' | 'bad', text}
let pasting = false; // the box for pasting a backup as text is open
let copyText = '';   // the backup as text, shown when the phone cannot copy by itself

const allIds = () => data.questions.map((q) => q.id);
const takeNote = () => { try { const n = sessionStorage.getItem(NOTE); sessionStorage.removeItem(NOTE); return n ? { kind: 'ok', text: n } : null; } catch { return null; } };
// After a load or an undo the page starts again, so no screen keeps anything from before.
const restart = (text) => { try { sessionStorage.setItem(NOTE, text); } catch { /* the note is lost, the load is not */ } location.reload(); };

function niceDay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// "54 of 128 known · 6 days in a row · New Jersey"
function line(state) {
  const n = summary(state, allIds(), dayNumber());
  const place = placeByCode(n.place);
  return [`<b>${n.known} of ${n.total}</b> known`, `${n.streak} day${n.streak === 1 ? '' : 's'} in a row`,
    `${n.interviews} interview${n.interviews === 1 ? '' : 's'}`, place ? esc(place.name) : 'no state picked'].join(' · ');
}

function downloadFile(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.hidden = true;
  document.body.append(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 60000); // let the phone finish first
}

// Save: the phone's Share menu if it takes files, an ordinary download if not.
async function saveBackup(rerender) {
  const text = pack(store.get());
  const name = fileName();
  const saved = (text2) => { store.set({ lastBackup: dayNumber() }); copyText = ''; note = { kind: 'ok', text: text2 }; rerender(); };
  // The phone never says whether a file really arrived, so the words ask the person to look.
  for (const [type, ext] of [['application/json', '.json'], ['text/plain', '.txt']]) {
    let file;
    try { file = new File([text], name.replace('.json', ext), { type }); } catch { break; }
    if (!navigator.canShare || !navigator.canShare({ files: [file] })) continue;
    try {
      await navigator.share({ files: [file], title: 'Citizenship Study backup' });
      return saved('Shared. Check that the file arrived where you sent it, then keep it safe or open it on your other phone.');
    } catch (e) {
      if (e && e.name === 'AbortError') return; // the person closed the Share menu
      break; // the Share menu failed: try a download
    }
  }
  try {
    downloadFile(text, name);
    saved(`A file named ${name} should now be in this phone’s downloads. Check that it is there. Not there? Use “Copy the backup as text” below.`);
  } catch {
    note = { kind: 'bad', text: 'This phone could not save a file. Use “Copy the backup as text” below.' };
    rerender();
  }
}

async function copyBackup(rerender) {
  const text = pack(store.get());
  try {
    await navigator.clipboard.writeText(text);
    copyText = '';
    note = { kind: 'ok', text: 'Copied, but not saved yet: paste it into a message or a note to yourself and send it. On the other phone, use “Paste a backup as text”.' };
  } catch {
    copyText = text; // the phone would not copy: show the text to copy by hand
    note = null;
  }
  rerender();
}

// A file or pasted text arrived: check it, then show both sides before anything changes.
function review(text, rerender, root) {
  const got = typeof text === 'string' && text.length > MAX_BYTES ? { error: 'big' } : unpack(text);
  if (got.error) { pending = null; note = { kind: 'bad', text: WHY[got.error] }; } else {
    if (got.state.place && !placeByCode(got.state.place)) got.state.place = null;
    const m = got.state.mock; // a 65/20 interview only asks starred questions
    if (m && m.list === '6520' && m.ids.some((id) => !data.byId[id].star6520)) got.state.mock = null;
    pending = got; note = null; pasting = false; pasted = '';
  }
  rerender();
  window.scrollTo(0, 0);
  root.querySelector(pending ? '.title' : '.note')?.focus({ preventScroll: true });
}

export function backup(root, _arg, rerender) {
  const s = store.get();
  note = note || takeNote();
  const noteHtml = note ? `<p class="note ${note.kind}" role="status" tabindex="-1">${esc(note.text)}</p>` : '';
  const top = topBar({ href: '#/', label: 'Home', icon: ICON.back });
  const kept = store.kept();

  if (pending) {
    const back = pending.back;
    const keptNow = !back && store.kept();
    root.innerHTML = frame(`${top}
      <section class="card">
        ${eagleHeader('Backup', back ? 'Put the earlier progress back?' : 'Load this backup?').replace('class="title"', 'class="title" tabindex="-1"')}
        <p class="lead">${back ? 'This <b>replaces</b> the progress on this phone with what it had before. What is on the phone now is kept, so you can switch back.'
          : 'Loading it <b>replaces</b> the progress on this phone. What is on the phone now is kept, so you can put it back.'}</p>
      </section>
      <div class="compare">
        <div class="side new"><h2 class="label">${back ? 'Earlier progress' : `This backup${pending.saved ? ` · saved ${esc(niceDay(pending.saved))}` : ''}`}</h2><p>${line(pending.state)}</p></div>
        <div class="side"><h2 class="label">This phone now</h2><p>${line(s)}</p></div>
      </div>
      ${keptNow ? `<p class="hint">This phone keeps one earlier copy. The one it keeps now (${line(keptNow)}) will be dropped.</p>` : ''}
      <button class="btn primary" data-act="${back ? 'putback' : 'replace'}">${back ? 'Put the earlier progress back' : 'Replace this phone’s progress'}</button>
      <button class="btn ghost" data-act="cancel">Cancel</button>`, { short: true });
  } else {
    root.innerHTML = frame(`${top}
      <section class="card">
        ${eagleHeader('Backup', 'Keep your progress safe')}
        <p class="lead">Your progress is saved only on this phone. A backup is one small file with all of it: use it to move to another phone, or to keep a copy.</p>
        <p class="hint">Last saved: ${ago(s.lastBackup, dayNumber())}</p>
      </section>
      ${noteHtml}
      <h2 class="group">Save</h2>
      <button class="btn primary" data-act="save">Save a backup</button>
      <button class="link" data-act="copy">Copy the backup as text</button>
      ${copyText ? `<label class="hint" for="out">Press and hold the text, choose Select All, then Copy.</label>
        <textarea id="out" class="paste" readonly rows="5">${esc(copyText)}</textarea>` : ''}
      <h2 class="group">Load</h2>
      <button class="btn ghost" data-act="pick">Load a backup</button>
      <input class="vh" id="pick" type="file" tabindex="-1" aria-hidden="true">
      <button class="link" data-act="paste" aria-expanded="${pasting}">Paste a backup as text</button>
      ${pasting ? `<label class="hint" for="in">Paste the backup text here.</label>
        <textarea id="in" class="paste" rows="5" autocomplete="off" autocapitalize="off" spellcheck="false">${esc(pasted)}</textarea>
        <button class="btn ghost" data-act="check">Check this backup</button>` : ''}
      ${kept ? `<h2 class="group">Loaded the wrong one?</h2>
        <button class="btn ghost" data-act="undo">Undo the load</button>
        <p class="hint">This phone kept what it had before: ${line(kept)}. You will see both before anything changes.</p>` : ''}
      <p class="fine">The file holds your state, the names you typed and your study progress. Nothing else, and it is sent nowhere unless you send it.</p>`, { short: true });
    const picker = root.querySelector('#pick');
    picker.onchange = async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      let text = null;
      if (file.size <= MAX_BYTES) { try { text = await file.text(); } catch { text = ''; } }
      picker.value = '';
      if (text === null) { note = { kind: 'bad', text: WHY.big }; rerender(); return; }
      review(text, rerender, root);
    };
  }

  wire(root, {
    save: () => saveBackup(rerender),
    copy: () => copyBackup(rerender),
    pick: () => root.querySelector('#pick').click(),
    paste: () => { pasting = !pasting; note = null; rerender(); if (pasting) root.querySelector('#in').focus(); },
    check: () => { pasted = root.querySelector('#in').value; review(pasted, rerender, root); },
    cancel: () => { pending = null; rerender(); },
    replace: () => {
      const next = pending.state;
      pending = null;
      if (store.replace(next)) return restart('Backup loaded. Your progress on this phone is now the one from the file. Wrong one? “Undo the load” is below.');
      note = { kind: 'bad', text: WHY.full };
      rerender();
    },
    undo: () => { if (kept) { pending = { state: kept, back: true }; note = null; rerender(); window.scrollTo(0, 0); root.querySelector('.title')?.focus({ preventScroll: true }); } },
    putback: () => {
      pending = null;
      if (store.undo()) return restart('Done. This phone has its earlier progress back. Changed your mind? “Undo the load” switches again.');
      note = { kind: 'bad', text: WHY.full };
      rerender();
    },
  });
}

// ---- guide ----

// The how-to video (made in promo/). It is not saved for offline use: it needs internet.
// With Español open the guide plays the Spanish one (Jose OK'd its script, 2026-11-12).
const VIDEO = { en: 'media/how-to-use-en', es: 'media/how-to-use-es' };

let guideData = null; // data/guide.json, fetched the first time the guide is opened
let guideFailed = false;

export function guide(root, _arg, rerender) {
  const top = topBar({ href: '#/', label: 'Home', icon: ICON.back });
  if (!guideData && !guideFailed) {
    fetch('data/guide.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((g) => { guideData = g; }, () => { guideFailed = true; })
      .then(() => { if (root.dataset.screen === 'guide') rerender(); });
  }
  const open = store.get().spanish;
  const body = guideData ? guideData.items.map((it, i) => `<section class="step">
      <h2><i aria-hidden="true">${i + 1}</i><span>${esc(it.t)}${open ? `<span class="es" lang="es">${esc(it.es.t)}</span>` : ''}</span></h2>
      ${it.p.map((p, j) => `<p>${esc(p)}</p>${open && it.es.p[j] ? `<p class="es" lang="es">${esc(it.es.p[j])}</p>` : ''}`).join('')}
    </section>`).join('')
    : `<p class="note ${guideFailed ? 'bad' : 'ok'}" role="status">${guideFailed ? 'The guide did not load. Check your internet connection and open it again.' : 'Opening the guide…'}</p>`;
  root.innerHTML = frame(`${top}
    <section class="card">
      ${eagleHeader('Guide · Guía', 'How to use this app')}
      <p class="lead">A short video, then short steps, one for each part of the app. Tap “Español” to read them in Spanish too.</p>
      <button class="es-toggle" data-act="spanish" aria-expanded="${open}">Español <span aria-hidden="true">${open ? '▴' : '▾'}</span></button>
      ${open && guideData && !guideData.checked ? '<p class="hint" lang="es">El español de esta guía es un <span class="draft">borrador</span> todavía no revisado.</p>' : ''}
    </section>
    <section class="video" aria-label="Video guide">
      <h2 class="label">Watch the guide · ${open ? '3' : '2'} minutes${open ? ' <span lang="es">· Vea la guía</span>' : ''}</h2>
      <video controls playsinline preload="none" aria-label="${open ? 'Video: cómo usar esta app' : 'Video: how to use this app'}" poster="${open ? VIDEO.es : VIDEO.en}.jpg" src="${open ? VIDEO.es : VIDEO.en}.mp4"${open ? ' lang="es"' : ''}></video>
      <p class="note bad" id="novideo" role="status" hidden>The video did not load. It needs internet. <span lang="es">El video no cargó. Necesita internet.</span></p>
      <p class="hint">The video needs internet.${open ? ' <span lang="es">El video necesita internet.</span>' : ' Tap “Español” above for the video in Spanish. <span lang="es">Toque “Español” para ver el video en español.</span>'}</p>
    </section>
    <div class="steps">${body}</div>
    <a class="btn ghost" href="#/backup">Open Backup</a>`, { short: true });
  wire(root, { spanish: toggleSpanish(rerender) });
  // no internet: say so instead of a play button that does nothing
  root.querySelector('.video video')?.addEventListener('error', () => { root.querySelector('#novideo').hidden = false; });
}

export function leaveMore() { pending = null; note = null; pasting = false; pasted = ''; copyText = ''; guideFailed = false; }
