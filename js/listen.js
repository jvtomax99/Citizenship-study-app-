// Speech to text with the phone's own recognizer (the Web Speech API). English only.
// Not every phone has it, and Chrome needs internet for it: the screen must always
// work by typing too.

const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const canListen = () => !!SR;

const WHY = {
  'not-allowed': 'The microphone is turned off for this app. Type your answer, or allow the microphone in your phone’s settings.',
  'service-not-allowed': 'This phone does not let the app listen here. Type your answer.',
  'audio-capture': 'No microphone was found. Type your answer.',
  network: 'Listening needs internet. Type your answer.',
  'no-speech': 'I did not hear anything. Tap the microphone and try again, or type.',
};

let rec = null;

export function stopListening() {
  if (rec) { rec.quiet = true; try { rec.abort(); } catch { /* already stopped */ } } // stopped on purpose: no message
  rec = null;
}

// Starts listening. onText(words so far) is called as the person speaks;
// onEnd(message) once at the end, with a plain reason when it failed, '' when it worked.
// It is not called when stopListening() ended it: the caller already knows.
export function listen({ onText, onEnd }) {
  stopListening();
  if (!SR) { onEnd('This phone cannot listen here. Type your answer.'); return; }
  const mine = new SR();
  rec = mine;
  mine.lang = 'en-US';
  mine.interimResults = true;
  mine.continuous = false;
  mine.maxAlternatives = 1;
  let heard = '', why = '', ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    if (rec === mine) rec = null;
    if (mine.quiet) return;
    onEnd(why || (heard ? '' : WHY['no-speech']));
  };
  mine.onresult = (e) => {
    heard = Array.from(e.results).map((r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
    if (heard) onText(heard);
  };
  mine.onerror = (e) => { if (e.error !== 'aborted') why = WHY[e.error] || 'Listening did not work this time. Type your answer.'; };
  mine.onend = finish;
  try { mine.start(); } catch { why = 'Listening did not start. Type your answer.'; finish(); }
}
