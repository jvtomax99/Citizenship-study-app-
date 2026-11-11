// Pick your state: fills the senator, governor and capital answers. Names that are
// not in data/officials.json are typed by the person, once.
import { data, placeByCode, needsTyping, niceDate } from './data.js';
import { store } from './store.js';
import { esc, frame, wire, ICON } from './ui.js';

let choosing = false; // true while the list is open on top of a saved state

const KIND = { state: 'State', district: 'Federal district', territory: 'U.S. territory' };

function listView(root, rerender, current) {
  root.innerHTML = frame(`
    <div class="top">
      ${current ? `<button class="x" data-act="cancel" aria-label="Back">${ICON.back}</button>` : ''}
      <div class="grow"></div>
    </div>
    <section class="card">
      <span class="who">Your answers</span>
      <h1 class="title">Where do you live?</h1>
      <p class="lead">Four questions on the test depend on your state: your senators, your representative, your governor and your capital.</p>
      <div class="field"><input id="find" type="search" placeholder="Type your state" aria-label="Find your state" autocomplete="off"></div>
    </section>
    <div class="rows" id="places">${data.places.map((p) => `<button class="row${p.code === current ? ' is-on' : ''}" data-act="pick" data-code="${p.code}" data-name="${esc(p.name.toLowerCase())} ${p.code.toLowerCase()}">
      <span class="row-main"><b>${esc(p.name)}</b></span>${p.type !== 'state' ? `<span class="row-count">${KIND[p.type]}</span>` : ''}${ICON.chevron}
    </button>`).join('')}</div>
    <p class="fine none" id="nomatch" hidden>No state with that name.</p>
    ${current ? '' : '<button class="btn ghost" data-act="skip">Skip for now</button>'}
  `, { short: true });

  const find = root.querySelector('#find');
  find.addEventListener('input', () => {
    const term = find.value.trim().toLowerCase();
    let shown = 0;
    root.querySelectorAll('#places .row').forEach((r) => {
      const hit = !term || r.dataset.name.includes(term);
      r.hidden = !hit; if (hit) shown++;
    });
    root.querySelector('#nomatch').hidden = shown > 0;
  });
  wire(root, {
    pick: (el) => { store.set({ place: el.dataset.code, skippedPlace: false }); choosing = false; rerender(); },
    cancel: () => { choosing = false; rerender(); },
    skip: () => { store.set({ skippedPlace: true }); location.hash = '#/'; },
  });
}

const checked = (p) => `<small>Checked ${niceDate(p.confirmed)}</small>`;

function detailsView(root, rerender, place) {
  const need = needsTyping(place);
  const t = store.typedFor(place.code);
  const special = place.answers || {};
  const territory = place.type === 'territory';
  const district = place.type === 'district';
  const input = (id, label, value, hint) => `<label class="typed"><span>${label}</span>
    <input id="${id}" type="text" value="${esc(value)}" autocomplete="off" autocapitalize="words" spellcheck="false">${hint ? `<small>${hint}</small>` : ''}</label>`;
  const fact = (label, body) => `<div class="fact"><span class="who">${label}</span>${body}</div>`;

  root.innerHTML = frame(`
    <div class="top"><a class="x" href="#/" aria-label="Home">${ICON.back}</a><div class="grow"></div></div>
    <section class="card">
      <span class="who">${KIND[place.type]}</span>
      <h1 class="title">${esc(place.name)}</h1>
      <button class="es-toggle" data-act="change">Change</button>

      ${fact('Capital · question 62', special[62] ? `<p>${esc(special[62])}</p>` : `<p>${esc(place.capital)}</p>`)}

      ${fact('U.S. senators · question 23', special[23] ? `<p>${esc(special[23])}</p>`
        : need.senators ? input('sen0', 'Senator', t.senators[0], '') + input('sen1', 'Senator', t.senators[1], 'Find both at <a href="https://www.senate.gov/senators/" target="_blank" rel="noopener">senate.gov</a>. Type the names as shown there.')
        : place.senators.map((p) => `<p>${esc(p.name)}</p>${checked(p)}`).join(''))}

      ${fact('Governor · question 61', special[61] ? `<p>${esc(special[61])}</p>`
        : need.governor ? input('gov', 'Governor', t.governor, `Find the name on your ${territory ? 'territory' : 'state'}’s official website.`)
        : `<p>${esc(place.governor.name)}</p>${checked(place.governor)}`)}

      ${fact(`${territory ? 'Delegate or Resident Commissioner' : district ? 'Delegate' : 'U.S. representative'} · question 29`,
        input('rep', territory ? 'Name (optional)' : district ? 'D.C.’s Delegate in the House' : 'Your representative', t.rep,
          territory ? 'You may also say that your territory has no voting representatives in Congress.'
            : district ? 'Find the name at <a href="https://www.house.gov/representatives" target="_blank" rel="noopener">house.gov</a>.'
            : 'It depends on your address. Find yours at <a href="https://www.house.gov/representatives/find-your-representative" target="_blank" rel="noopener">house.gov</a> with your ZIP code.'))}
    </section>
    <div class="spacer"></div>
    <div class="actions"><button class="btn primary" data-act="save">Save</button></div>
  `, { short: true });

  const val = (id) => (root.querySelector('#' + id)?.value ?? '').trim().replace(/\s+/g, ' ');
  const keep = () => { // saved as you type, so leaving by any button keeps the names
    const typed = { ...store.get().typed };
    typed[place.code] = {
      senators: need.senators ? [val('sen0'), val('sen1')] : t.senators,
      governor: need.governor ? val('gov') : t.governor,
      rep: val('rep'),
    };
    store.set({ typed });
  };
  root.querySelectorAll('.typed input').forEach((el) => el.addEventListener('input', keep));
  wire(root, {
    change: () => { keep(); choosing = true; rerender(); },
    save: () => { keep(); location.hash = '#/'; },
  });
}

export function leavePlace() { choosing = false; }

export function place(root, _arg, rerender) {
  const current = placeByCode(store.get().place);
  if (!current || choosing) listView(root, rerender, current && current.code);
  else detailsView(root, rerender, current);
}
