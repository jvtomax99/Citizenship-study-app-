// Read-aloud with the phone's own voice (the Web Speech API). English only.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
export const canSpeak = () => !!synth && typeof SpeechSynthesisUtterance !== 'undefined';

let voice = null;
function pickVoice() {
  const all = synth.getVoices();
  voice = all.find((v) => v.lang === 'en-US' && v.localService) || all.find((v) => v.lang === 'en-US')
    || all.find((v) => v.lang && v.lang.startsWith('en')) || null;
}
if (canSpeak()) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice); // voices load late on Android
}

export function stopSpeaking() {
  if (canSpeak()) synth.cancel();
  document.querySelectorAll('.speak.is-speaking').forEach((b) => b.classList.remove('is-speaking'));
}

// Says the text a little slower than normal, the way an officer would. Tapping the
// button again while it talks stops it.
export function speak(text, button) {
  if (!canSpeak()) return;
  const was = button && button.classList.contains('is-speaking');
  stopSpeaking();
  if (was) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  if (voice) u.voice = voice;
  u.rate = 0.9;
  const done = () => button && button.classList.remove('is-speaking');
  u.onend = done; u.onerror = done;
  if (button) button.classList.add('is-speaking');
  synth.speak(u);
}
