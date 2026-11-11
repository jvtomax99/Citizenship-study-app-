import { isKnown } from './srs.js';

// Loads the three data files and joins them by question id. Nothing here rewrites a
// question or an answer: the USCIS wording is always shown as it is in questions.json.

export const data = { questions: [], byId: {}, es: {}, officials: null, places: [], sections: [] };

const GROUPS = { government: 'American Government', history: 'American History', symbols: 'Symbols and Holidays' };

export async function loadData() {
  const [q, es, off] = await Promise.all(
    ['data/questions.json', 'data/es.json', 'data/officials.json'].map((u) => fetch(u).then((r) => {
      if (!r.ok) throw new Error(u + ' ' + r.status);
      return r.json();
    })));
  data.questions = q.questions;
  data.byId = Object.fromEntries(q.questions.map((x) => [x.id, x]));
  data.es = es.questions;
  data.officials = off;
  data.places = off.places.slice().sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Map();
  for (const x of q.questions) {
    const key = x.section + '-' + x.part;
    if (!seen.has(key)) seen.set(key, { key, group: GROUPS[x.section] || x.section, title: x.partTitle, ids: [] });
    seen.get(key).ids.push(x.id);
  }
  data.sections = [...seen.values()];
}

export const placeByCode = (code) => data.places.find((p) => p.code === code) || null;

// The question ids in a list: 'all' or '6520' (the 20 starred questions).
export const idsInList = (list, ids = data.questions.map((q) => q.id)) =>
  list === '6520' ? ids.filter((id) => data.byId[id].star6520) : ids;

// The sections that have questions in a list, with how many of them are known.
export function sectionRows(list, cards) {
  return data.sections.map((s) => {
    const ids = idsInList(list, s.ids);
    return { ...s, ids, known: ids.filter((id) => isKnown(cards[id])).length };
  }).filter((s) => s.ids.length);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function niceDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'the official site'; } };
// "Checked Nov 11, 2026 at senate.gov." site: false leaves the site out (the place screen).
export const checkedLine = (p, { site = true } = {}) => `Checked ${niceDate(p.confirmed)}${site ? ` at ${host(p.source)}.` : ''}`;

function person(p, todayIso) {
  let caption = checkedLine(p);
  const recheck = (p.recheck || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(recheck) && todayIso >= recheck) caption += ' This may have changed since: check again.';
  return { text: p.name, caption };
}
const typed = (text, where) => ({ text, caption: `You typed this. Check it at ${where}.` });

// The answers that depend on the person or on today's officeholders.
//   mine: [{text, caption}]  names or sentences to say, with where they came from
//   ask:  null | 'place' (no state picked yet) | 'typed' (a name still has to be typed)
// The USCIS text (q.answers) is shown under these either way.
const localIso = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function personalAnswers(q, profile, todayIso = localIso()) {
  if (q.kind === 'fixed') return { mine: [], ask: null };

  if (q.kind === 'current-official') {
    const f = data.officials.federal[q.id];
    const caption = f.confirmed
      ? checkedLine(f) + (f.also && f.also.length ? ` USCIS also accepts: ${f.also.join(', ')}.` : '')
      : `The name USCIS lists (its page was last reviewed ${niceDate(f.sourceReviewed)}). Confirm at uscis.gov/citizenship/testupdates before your interview.`;
    return { mine: [{ text: f.name, caption }], ask: null };
  }

  const place = placeByCode(profile.place);
  if (!place) return { mine: [], ask: 'place' };
  const t = profile.typed;
  const special = place.answers && place.answers[q.id];
  if (special) return { mine: [{ text: special, caption: '' }], ask: null };

  if (q.id === 23) {
    if (Array.isArray(place.senators) && place.senators.length)
      return { mine: place.senators.map((s) => person(s, todayIso)), ask: null };
    const names = t.senators.map((s) => s.trim()).filter(Boolean);
    return names.length ? { mine: names.map((n) => typed(n, 'senate.gov')), ask: null } : { mine: [], ask: 'typed' };
  }
  if (q.id === 29) {
    const n = t.rep.trim();
    if (n) return { mine: [typed(n, 'house.gov')], ask: null };
    // USCIS (the note on question 29): a territory resident may say this instead of a name.
    if (place.type === 'territory') return { mine: [{ text: 'My territory has no voting representatives in Congress.',
      caption: 'USCIS accepts a statement like this, or the name of your Delegate or Resident Commissioner.' }], ask: null };
    return { mine: [], ask: 'typed' };
  }
  if (q.id === 61) {
    if (place.governor && place.governor.name) return { mine: [person(place.governor, todayIso)], ask: null };
    const n = t.governor.trim();
    const site = place.type === 'territory' ? "your territory's official website" : "your state's official website";
    return n ? { mine: [typed(n, site)], ask: null } : { mine: [], ask: 'typed' };
  }
  if (q.id === 62) return { mine: [{ text: place.capital, caption: place.capitalAlso ? `Also written ${place.capitalAlso.join(' or ')}.` : '' }], ask: null };
  return { mine: [], ask: null };
}

// What the place screen has to ask for: which names are not in the data file.
export function needsTyping(place) {
  const special = place.answers || {};
  return {
    senators: !special[23] && !(Array.isArray(place.senators) && place.senators.length),
    governor: !special[61] && !(place.governor && place.governor.name),
  };
}
