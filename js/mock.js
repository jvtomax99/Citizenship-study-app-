// Mock interview: the officer reads each question aloud, you answer by voice or by
// typing, the app checks it and you can overrule it. It stops as USCIS does
// (js/match.js: 12 right or 9 wrong; on the 65/20 list, 6 right or 5 wrong).
import { data, idsInList, personalAnswers } from './data.js';
import { store } from './store.js';
import { grade, dayNumber } from './srs.js';
import { speak, stopSpeaking } from './speak.js';
import { canListen, listen, stopListening } from './listen.js';
import { RULES, standing, pickQuestions, judge } from './match.js';
import { esc, frame, topBar, questionCard, wire, eagleHeader } from './ui.js';

// The interview in progress lives in the store (it survives closing the app):
//   {list, ids, log: [{id, said, auto, verdict, flipped}], open}
//   open = the answer on the sheet right now, not yet counted: {said, auto, verdict}
let live = false;   // has Start or Continue been tapped since this screen was opened
let spoken = null;  // the question id already read aloud
let note = '';      // one line under the answer field (why the microphone stopped)
let draft = '';     // what is in the answer field
let hearing = false;
let host = null;

const STAR = '<path d="M12 2.6l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17.2l-5.8 3.2 1.3-6.5L2.7 9.4l6.5-.8z"/>';
const MIC = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>';

const NAMED = new Set([23, 29, 30, 38, 39, 57, 61]); // the answer is a person's name
const get = () => store.get().mock;
const save = (m) => store.set({ mock: m });
const installedIos = () => typeof navigator !== 'undefined' && navigator.standalone === true;

function begin() {
  const list = store.get().list;
  save({ list, ids: pickQuestions(idsInList(list), list), log: [], open: null });
  spoken = null; draft = ''; note = '';
}

// The answers for this person first (their senators, today's President), then USCIS's.
function answersFor(q) {
  const s = store.get();
  const { mine, ask } = personalAnswers(q, { place: s.place, typed: store.typedFor(s.place) });
  return { mine: mine.map((m) => m.text), ask, accepted: q.answers.map((a) => a.text),
    // for the checker: a personal question is checked against the person's answers only
    // ("Answers will vary." is not an answer); up to four words is a name, more is a sentence
    // such as "D.C. has no U.S. senators."
    check: q.kind === 'fixed' ? { question: q.question, accepted: q.answers.map((a) => a.text), need: q.need }
      : { question: q.question, mine: mine.map((m) => ({ text: m.text, name: NAMED.has(q.id) && m.text.trim().split(/\s+/).length <= 4 })) } };
}

function accepted(q) {
  const { mine, ask, accepted: official } = answersFor(q);
  const personal = q.kind !== 'fixed';
  const many = q.need > 1 ? `The officer accepts any ${q.need} of these:` : (official.length > 1 ? 'The officer accepts any one of these:' : 'The officer accepts:');
  return `${personal ? `<p>${mine.length ? 'Your answer:' : 'This answer depends on you.'}</p>
      ${mine.length ? `<ul>${mine.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      ${ask ? `<small>${ask === 'place' ? 'Pick your state on the Home screen and the app will show it.' : 'Add the name under your state on the Home screen and the app will check it.'}</small>` : ''}
      <p class="also">What USCIS says:</p>` : `<p>${many}</p>`}
    <ul>${official.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    ${official.some((a) => a.includes('(')) ? '<small>Words in parentheses are optional.</small>' : ''}`;
}

function road(st) {
  return `<div class="road" role="img" aria-label="${st.right} of ${st.pass} right answers needed to pass, ${st.wrong} of ${st.fail} misses">
    <div class="stars">${Array.from({ length: st.pass }, (_, i) => `<svg class="st${i < st.right ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg>`).join('')}</div>
    <p><span><b>${st.right} of ${st.pass}</b> right to pass</span><span><b>${st.wrong} of ${st.fail}</b> misses</span></p>
  </div>`;
}

const LISTENING = 'Listening… say your answer.';
// the question on screen now, or null (a late answer from the microphone must not land on the next one)
const current = () => { const m = get(); return live && m && !m.open ? m.ids[m.log.length] : null; };

function paintMic(root) {
  const b = root.querySelector('.mic');
  const n = root.querySelector('.mic-note');
  if (b) { b.classList.toggle('is-listening', hearing); b.setAttribute('aria-pressed', hearing); b.setAttribute('aria-label', hearing ? 'Stop listening' : 'Answer out loud'); }
  if (n) n.textContent = hearing ? LISTENING : note;
}

// ---- screens ----

function startScreen(root, rerender) {
  const m = get();
  const going = m && !standing(m.log, m.list).over;
  const list = going ? m.list : store.get().list;
  const rule = RULES[list];
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Home' })}
    <section class="card">
      ${eagleHeader(`Mock interview${list === '6520' ? ' · 65/20' : ''}`, going ? 'Welcome back' : 'Ready for the officer?')}
      <p class="lead">The officer asks up to <b>${rule.ask}</b> questions out loud. <b>${rule.pass}</b> right and you pass. It stops at ${rule.pass} right or ${rule.fail} wrong, as the real interview does.</p>
      <p class="hint">${canListen()
        ? 'Answer out loud with the microphone, or type. To turn your voice into words, the phone sends it to Apple or Google.'
        : `This phone cannot listen here, so you type your answers.${installedIos() ? ' The microphone may work if you open the app in Safari instead.' : ''}`}</p>
    </section>
    <div class="spacer"></div>
    <div class="actions">
      ${going ? `<button class="btn primary" data-act="go">Continue · ${m.log.length} answered</button>
        <button class="btn ghost" data-act="fresh">Start a new interview</button>`
        : '<button class="btn primary" data-act="fresh">Start the interview</button>'}
    </div>`);
  wire(root, {
    go: () => { live = true; rerender(); },
    fresh: () => { begin(); live = true; rerender(); window.scrollTo(0, 0); },
  });
}

const SHEET = {
  right: { cls: 'right', mark: '✓', title: 'Right!', btn: 'primary' },
  wrong: { cls: 'wrong', mark: '✕', title: 'Not this time', btn: 'danger' },
};

function sheet(q, open, last) {
  const you = open.said ? `<p class="you">You said: <b>${esc(open.said)}</b></p>` : '';
  const next = last ? 'See the result' : 'Next question';
  if (!open.verdict) {
    return `<div class="sheet ask">
      <h2 tabindex="-1">Compare your answer</h2>
      ${you || '<p class="you">You did not type or say an answer here.</p>'}
      ${accepted(q)}
      <div class="pair">
        <button class="btn primary" data-act="mark" data-verdict="right">I was right</button>
        <button class="btn danger" data-act="mark" data-verdict="wrong">I was wrong</button>
      </div>
    </div>`;
  }
  const s = SHEET[open.verdict];
  const flip = open.auto === 'skip' ? '' // "I don't know" is a miss: nothing to overrule
    : open.auto === 'unsure' ? 'Change my mark'
    : open.auto !== open.verdict ? 'Undo: put it back'
    : open.verdict === 'wrong' ? 'The app got it wrong: I was right' : 'I was actually wrong';
  return `<div class="sheet ${s.cls}">
    <h2 tabindex="-1"><i aria-hidden="true">${s.mark}</i>${s.title}</h2>
    ${you}
    ${accepted(q)}
    <button class="btn ${s.btn}" data-act="next">${next}</button>
    ${flip ? `<button class="flip" data-act="flip">${flip}</button>` : ''}
  </div>`;
}

function results(root, m, rerender) {
  const st = standing(m.log, m.list);
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Home', done: m.log.length, total: m.log.length, barLabel: 'Interview finished' })}
    <section class="card">
      ${eagleHeader('Interview finished', st.passed ? 'You passed!' : 'Not yet')}
      <div class="score">
        <div class="good"><b>${st.right}</b><span>right</span></div>
        <div><b>${st.wrong}</b><span>wrong</span></div>
        <div><b>${st.pass}</b><span>to pass</span></div>
      </div>
      <p class="lead">${st.passed
        ? `The officer stops at ${st.pass} right answers. You got there in ${m.log.length} questions.`
        : `The officer stops at ${st.fail} wrong answers. The ones you missed come back first in your drill.`}</p>
    </section>
    <h2 class="label section-head">What the officer asked</h2>
    <div class="review">${m.log.map((e, i) => {
      const q = data.byId[e.id];
      return `<details class="${e.verdict}"${e.verdict === 'wrong' ? ' open' : ''}>
        <summary><i aria-hidden="true">${e.verdict === 'right' ? '✓' : '✕'}</i><span>${i + 1}. ${esc(q.question)}<small>${e.verdict === 'right' ? 'Right' : 'Wrong'}${e.said ? ` · you said: ${esc(e.said)}` : ' · no answer'}</small></span></summary>
        <div class="sheetlike">${accepted(q)}</div>
      </details>`;
    }).join('')}</div>
    <div class="spacer"></div>
    <div class="actions">
      <button class="btn primary" data-act="again">Another interview</button>
      <a class="btn ghost" href="#/">Home</a>
    </div>`);
  wire(root, { again: () => { begin(); live = true; rerender(); window.scrollTo(0, 0); } });
}

// Count the answer on the sheet and move on.
function settle(m) {
  const id = m.ids[m.log.length];
  const log = [...m.log, { id, ...m.open, flipped: (m.open.auto === 'right' || m.open.auto === 'wrong') && m.open.auto !== m.open.verdict }];
  if (m.open.verdict === 'wrong') { // a miss comes back sooner in the drill
    const cards = { ...store.get().cards };
    cards[id] = grade(cards[id], 'missed', dayNumber());
    store.set({ cards });
  }
  store.countAnswer();
  const next = { ...m, log, open: null };
  const st = standing(log, m.list);
  if (st.over) {
    const history = [...(store.get().mockHistory || []), { day: dayNumber(), list: m.list, right: st.right, wrong: st.wrong, passed: st.passed }].slice(-10);
    store.set({ mockHistory: history });
  }
  save(next);
  draft = ''; note = '';
}

export function mock(root, _arg, rerender) {
  host = root;
  const m = get();
  if (m && standing(m.log, m.list).over) return results(root, m, rerender); // also after a reload
  if (!live || !m) return startScreen(root, rerender);

  const q = data.byId[m.ids[m.log.length]];
  const st = standing(m.log, m.list);
  // would this answer end the interview?
  const last = m.open && m.open.verdict && standing([...m.log, m.open], m.list).over;
  root.innerHTML = frame(`
    ${topBar({ href: '#/', label: 'Leave the interview', done: m.log.length, total: st.ask, barLabel: `${m.log.length} of up to ${st.ask} questions answered`, pills: [`✓ ${st.right}`, `✕ ${st.wrong}`] })}
    ${questionCard(q, { chips: [`Mock interview · ${m.log.length + 1} of ${st.ask}`], spanish: false })}
    <div class="field">
      <input id="answer" type="text" placeholder="${canListen() ? 'Say or type your answer' : 'Type your answer'}" aria-label="Your answer"
        autocomplete="off" autocapitalize="sentences" enterkeyhint="done" value="${esc(m.open ? m.open.said : draft)}"${m.open ? ' disabled' : ''}>
      ${canListen() && !m.open ? `<button class="mic${hearing ? ' is-listening' : ''}" data-act="mic" aria-label="${hearing ? 'Stop listening' : 'Answer out loud'}" aria-pressed="${hearing}">${MIC}</button>` : ''}
    </div>
    <p class="mic-note" role="status">${esc(hearing ? LISTENING : note)}</p>
    ${road(st)}
    <div class="spacer"></div>
    ${m.open ? sheet(q, m.open, last) : `<div class="actions">
      <button class="btn primary" data-act="check">Check my answer</button>
      <button class="btn ghost" data-act="skip">I don’t know</button>
    </div>`}`);

  const input = root.querySelector('#answer');
  const check = () => {
    stopListening(); hearing = false; stopSpeaking();
    const said = input.value.trim();
    const a = answersFor(q);
    const auto = said ? judge(said, a.check) : 'unsure';
    save({ ...m, open: { said, auto, verdict: auto === 'unsure' ? null : auto } });
    rerender();
  };
  input.oninput = () => { draft = input.value; };
  input.onkeydown = (e) => { if (e.key === 'Enter' && !m.open) { e.preventDefault(); input.blur(); check(); } };

  wire(root, {
    check,
    skip: () => { stopListening(); hearing = false; stopSpeaking(); save({ ...m, open: { said: input.value.trim(), auto: 'skip', verdict: 'wrong' } }); rerender(); },
    mark: (el) => { save({ ...m, open: { ...m.open, verdict: el.dataset.verdict } }); rerender(); },
    // after "I was right / I was wrong" this goes back to the two buttons; otherwise it overrules the app
    flip: () => { save({ ...m, open: { ...m.open, verdict: m.open.auto === 'unsure' ? null : (m.open.verdict === 'right' ? 'wrong' : 'right') } }); rerender(); },
    next: () => { settle(get()); rerender(); window.scrollTo(0, 0); },
    // The microphone changes the button and the line under the field in place: a full
    // redraw would close the keyboard and swallow the next tap.
    mic: () => {
      if (hearing) { stopListening(); hearing = false; paintMic(root); return; }
      stopSpeaking(); // the microphone must not hear the officer
      hearing = true; note = '';
      const asked = q.id;
      listen({
        onText: (t) => { if (current() !== asked) return; draft = t; const f = root.querySelector('#answer'); if (f) f.value = t; },
        onEnd: (why) => { if (current() !== asked) return; hearing = false; note = why; paintMic(root); },
      });
      paintMic(root);
    },
    speak: () => { if (hearing) { stopListening(); hearing = false; paintMic(root); } }, // the officer repeats: stop listening first
  }, () => q);

  // the sheet and its buttons must be on screen without a scroll, and a screen reader hears it
  if (m.open) {
    root.querySelector('.sheet').scrollIntoView({ block: 'end' });
    root.querySelector('.sheet h2').focus({ preventScroll: true });
  }
  if (!m.open && spoken !== q.id) { // the officer reads each new question once, by himself
    spoken = q.id;
    speak(q.question, root.querySelector('.speak'));
  }
}

export function leaveMock() {
  stopListening();
  hearing = false; live = false; spoken = null; note = '';
  if (host) { const f = host.querySelector('#answer'); if (f) { f.oninput = null; f.onkeydown = null; } }
  const m = get();
  if (m && standing(m.log, m.list).over) save(null); // a finished interview does not greet you again
}
