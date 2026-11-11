// Starts the app and shows the screen the address asks for:
//   #/  Home    #/place  Pick your state    #/study[/section]  Study cards    #/drill  Drill
import { loadData } from './data.js';
import { store } from './store.js';
import { stopSpeaking } from './speak.js';
import { home } from './home.js';
import { place } from './place.js';
import { study, leaveStudy } from './study.js';
import { drill, leaveDrill } from './drill.js';

const root = document.getElementById('app');
const screens = { '': home, place, study, drill };

function render() {
  const [name = '', arg = ''] = location.hash.replace(/^#\/?/, '').split('/');
  const s = store.get();
  if (!s.place && !s.skippedPlace && name !== 'place') { location.replace('#/place'); return; }
  root.dataset.screen = name || 'home';
  (screens[name] || home)(root, arg, render);
}

window.addEventListener('hashchange', () => {
  stopSpeaking(); leaveStudy(); leaveDrill();
  render();
  window.scrollTo(0, 0);
});

loadData().then(render).catch(() => {
  root.innerHTML = '<div class="content short"><section class="card"><h1 class="title">The questions did not load</h1><p class="lead">Check your internet connection and open the app again.</p></section></div>';
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
