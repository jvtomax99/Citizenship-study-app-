import React from 'react';
import en from './script.en.json';
import es from './script.es.json';
import ten from './timing.en.json';
import tes from './timing.es.json';

export const FPS = 30;
const LEAD = 0.5; // silence before a scene's first line, seconds
const GAP = 0.35; // between lines
const TAIL = 0.75; // after a scene's last line

export type Lang = 'en' | 'es';
export type Line = {text: string; file: string; start: number; dur: number}; // frames, from the scene's start
export type Scene = {id: string; head: string[]; from: number; dur: number; lines: Line[]};
type Raw = {id: string; head: string[]; lines: string[]}[];

const f = (s: number) => Math.round(s * FPS);

function build(lang: Lang, script: Raw, t: Record<string, number>) {
  let at = 0;
  const scenes: Scene[] = script.map((s) => {
    let cur = f(LEAD);
    const lines = s.lines.map((text, i) => {
      const name = `${s.id}-${i}.wav`;
      const dur = f(t[name]);
      const line = {text, file: `${lang}/${name}`, start: cur, dur};
      cur += dur + f(GAP);
      return line;
    });
    const dur = cur - f(GAP) + f(TAIL);
    const scene = {id: s.id, head: s.head, from: at, dur, lines};
    at += dur;
    return scene;
  });
  return {scenes, total: at};
}
export const TL = {en: build('en', en as Raw, ten), es: build('es', es as Raw, tes)};
export const LangCtx = React.createContext<Lang>('en');
export const useLang = () => React.useContext(LangCtx);
