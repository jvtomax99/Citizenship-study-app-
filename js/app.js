// Starts the app and shows the screen the address asks for:
//   #/  Home    #/place  Pick your state    #/study[/section]  Study cards    #/drill  Drill
//   #/mock  Mock interview    #/mall  The National Mall    #/drill/<part>  Drill one part
//   #/backup  Save and load a backup    #/guide  How to use this app
import { loadData } from './data.js';
import { store } from './store.js';
import { stopSpeaking } from './speak.js';
import { home } from './home.js';
import { place, leavePlace } from './place.js';
import { study, leaveStudy } from './study.js';
import { drill, leaveDrill } from './drill.js';
import { mock, leaveMock } from './mock.js';
import { mall, leaveMall } from './mall.js';
import { backup, guide, leaveMore } from './more.js';

const root = document.getElementById('app');
const screens = { '': home, place, study, drill, mock, mall, backup, guide };

function render() {
  const [name = '', arg = ''] = location.hash.replace(/^#\/?/, '').split('/');
  const s = store.get();
  if (!s.place && !s.skippedPlace && !['place', 'backup', 'guide'].includes(name)) { location.replace('#/place'); return; }
  const screen = screens[name] || home;
  root.dataset.screen = screen === home ? 'home' : name;
  screen(root, arg, render);
}

window.addEventListener('hashchange', () => {
  stopSpeaking(); leaveStudy(); leaveDrill(); leaveMock(); leavePlace(); leaveMall(); leaveMore();
  render();
  window.scrollTo(0, 0);
});

loadData().then(render).catch(() => {
  root.innerHTML = '<div class="content short"><section class="card"><h1 class="title">The questions did not load</h1><p class="lead">Check your internet connection and open the app again.</p></section></div>';
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
