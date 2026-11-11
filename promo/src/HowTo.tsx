import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, FadeIn, IW, SW, Shot} from './Phone';
import {ChromeSteps, HomeScreen, SafariSteps} from './Mocks';
import {Backdrop, Buddy, Burst, CYAN, GhostText, Headline, Kicker, MusicBed, Neon, PINK, Phone3D, Pop, PopCard, Sfx, Sweep, WhipIn, WordSubs, clamp} from './Fx';
import {Lang, LangCtx, Scene, TL, useLang} from './timeline';
import layout from './layout.json';

// Positions measured from the app by tools/capture.cjs, in screenshot pixels: [x, y, w, h].
type R = number[];
const LY = layout as unknown as Record<string, Record<string, R>>;
const mid = (r: R) => ({x: r[0] + r[2] / 2, y: r[1] + r[3] / 2});
const box = (r: R, from: number, to: number, pad = 10) => ({from, to, x: r[0] - pad, y: r[1] - pad, w: r[2] + 2 * pad, h: r[3] + 2 * pad});

// The app's own fonts (Fraunces and Nunito, OFL), loaded before the first frame.
for (const [family, file, style] of [['Fraunces', 'fraunces', 'normal'], ['Fraunces', 'fraunces-italic', 'italic'], ['Nunito', 'nunito', 'normal']]) {
  const handle = delayRender(file);
  new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)})`, {weight: '100 900', style})
    .load()
    .then((f) => { document.fonts.add(f); continueRender(handle); })
    .catch(() => continueRender(handle));
}

/** A moment inside line i: p = 0 is its first word, 1 its last. The two languages say the same
    thing at different lengths, so the pictures are timed by how far through a line the voice is. */
const fr = (s: Scene, i: number, p: number) => s.lines[i].start + Math.round(s.lines[i].dur * p);

// Where the phone sits, and the scale from screenshot pixels to video pixels (for floating cards).
const PH = {left: 120, top: 420, scale: 0.86};
const K = (SW / IW) * PH.scale;
const SCREEN = {left: PH.left + 14 * PH.scale, top: PH.top + 14 * PH.scale};
const ADDRESS = 'jvtomax99.github.io/Citizenship-study-app-';

// The words drawn on screen besides the headlines and subtitles (those are in script.<lang>.json).
const T = {
  en: {hookK: 'The citizenship interview', civics: 'Civics Questions', asks: 'The officer asks up to', need: 'Right. You Pass.', how: 'How to use it',
    ghost: {ios: 'Share', android: 'Install', icon: 'No Internet Needed', state: 'New Jersey', study: 'Study Cards', drill: 'Out Loud', mock: '12 Right', list: '65 / 20', goal: 'National Mall', backup: 'Backup'},
    back: 'Guessed or missed: it comes back sooner', wait: 'Knew it: it waits longer each time', days: ['1 day', '3 days', '7 days', '14 days', '30 days'],
    notUscis: 'Not made by USCIS.', check: 'Check officials’ names at uscis.gov', add: 'Add It to Your Home Screen.', daily: 'Study a Little Every Day.'},
  es: {hookK: 'La entrevista de ciudadanía', civics: 'preguntas de cívica', asks: 'El oficial hace hasta', need: 'correctas. Usted aprueba.', how: 'Cómo se usa',
    ghost: {ios: 'Compartir', android: 'Instalar', icon: 'Sin internet', state: 'New Jersey', study: 'Study Cards', drill: 'En voz alta', mock: '12 correctas', list: '65 / 20', goal: 'National Mall', backup: 'Backup'},
    back: 'Adivinó o no la supo: vuelve más pronto', wait: 'La sabía: espera más días cada vez', days: ['1 día', '3 días', '7 días', '14 días', '30 días'],
    notUscis: 'Esta app no es de USCIS.', check: 'Revise los nombres en uscis.gov', add: 'Póngala en su pantalla de inicio.', daily: 'Estudie un poco cada día.'},
};

/** A phone scene: the Mall behind, headline, phone in 3D with its screen, floating cards, the eagle. */
const PhoneScene: React.FC<{s: Scene; steps: string[]; pops?: Pop[]; hops?: number[]; children: React.ReactNode; color?: string}> = ({s, steps, pops = [], hops = [], children, color}) => {
  const ghost = (T[useLang()].ghost as Record<string, string>)[s.id];
  return (
    <AbsoluteFill>
      <Backdrop />
      {ghost && <GhostText text={ghost} top={760} />}
      <Phone3D left={PH.left} top={PH.top} scale={PH.scale}>{children}</Phone3D>
      {pops.map((p, i) => (
        <React.Fragment key={i}>
          <PopCard {...p} phoneLeft={SCREEN.left} phoneTop={SCREEN.top} k={K} />
          <Sfx at={p.at} name="pop" volume={0.45} />
        </React.Fragment>
      ))}
      <Buddy hops={[...hops, ...pops.map((p) => p.at)]} />
      <Headline a={s.head[0]} b={s.head[1]} step={steps.indexOf(s.id)} steps={steps.length} color={color} />
    </AbsoluteFill>
  );
};

/** The hook: 128 questions, up to 20 asked, 12 stars to pass. */
const Hook: React.FC<{s: Scene}> = ({s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = T[useLang()];
  const l1 = s.lines[1].start, stars = fr(s, 1, 0.5);
  const pop = (f: number) => spring({frame: frame - f, fps, config: {damping: 12, mass: 0.6}});
  const n128 = Math.round(interpolate(frame, [10, 40], [0, 128], clamp));
  return (
    <AbsoluteFill>
      <Backdrop bright={0.5} />
      <GhostText text={frame < l1 ? '128' : '12'} top={300} />
      {frame < l1 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30, paddingBottom: 300}}>
          <Kicker text={t.hookK} at={4} color={C.amber} style={{fontSize: 30, letterSpacing: 9}} />
          <div style={{transform: `scale(${pop(10)})`}}><Neon color={C.amber} size={330}>{n128}</Neon></div>
          <div style={{opacity: interpolate(frame, [36, 46], [0, 1], clamp)}}><Neon color={C.amber} size={84}>{t.civics}</Neon></div>
        </AbsoluteFill>
      )}
      {frame >= l1 && frame < stars && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30, paddingBottom: 300}}>
          <Kicker text={t.asks} at={l1} color={CYAN} style={{fontSize: 30, letterSpacing: 9}} />
          <div style={{transform: `scale(${pop(l1 + 8)})`}}><Neon color={CYAN} size={330}>20</Neon></div>
        </AbsoluteFill>
      )}
      {frame >= stars && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 40, paddingBottom: 300}}>
          <div style={{transform: `scale(${pop(stars)})`}}><Neon color={C.amber} size={330}>12</Neon></div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18}}>
            {Array.from({length: 12}, (_, i) => {
              const p = pop(stars + 6 + i * 3);
              return <div key={i} style={{fontSize: 92, lineHeight: 1, color: C.amber, transform: `scale(${p})`, textShadow: `0 0 26px ${C.amber}`}}>★</div>;
            })}
          </div>
          <div style={{opacity: interpolate(frame, [stars + 30, stars + 40], [0, 1], clamp), textAlign: 'center', padding: '0 60px'}}><Neon color={C.amber} size={78}>{t.need}</Neon></div>
          <Burst at={stars + 44} x={540} y={760} n={22} />
        </AbsoluteFill>
      )}
      <Sfx at={10} name="hit" volume={0.5} />
      <Sfx at={l1 + 8} name="pop" volume={0.5} />
      <Sfx at={stars} name="hit" volume={0.45} />
      {Array.from({length: 12}, (_, i) => <Sfx key={i} at={stars + 6 + i * 3} name="tick" volume={0.4} />)}
      <Sfx at={stars + 44} name="chime" volume={0.4} />
    </AbsoluteFill>
  );
};

/** The title: the icon lands over the Mall at golden hour, then the name. */
const Title: React.FC<{s: Scene}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = T[useLang()];
  const icon = spring({frame: frame - 6, fps, config: {damping: 10, mass: 0.7}});
  const title = spring({frame: frame - 18, fps, config: {damping: 200}});
  return (
    <AbsoluteFill>
      <Backdrop src="mall-day" bright={0.7} />
      <GhostText text="Citizenship Study" top={330} speed={1.6} />
      <div style={{position: 'absolute', left: 540 - 190, top: 520, width: 380, height: 380, transform: `scale(${icon})`, WebkitBoxReflect: 'below 30px linear-gradient(transparent 70%, rgba(255,255,255,0.18))'} as React.CSSProperties}>
        <Img src={staticFile('icons/icon-512.png')} style={{width: 380, height: 380, borderRadius: 86, boxShadow: `0 0 80px ${C.amber}, 0 40px 80px rgba(0,0,0,0.6)`}} />
        <AbsoluteFill style={{borderRadius: 86, overflow: 'hidden'}}><Sweep at={24} dur={30} /></AbsoluteFill>
      </div>
      <Burst at={8} x={540} y={710} n={22} />
      <div style={{position: 'absolute', left: 40, right: 40, top: 1200, textAlign: 'center', opacity: title, transform: `translateY(${(1 - title) * 40}px)`}}>
        <Neon color={C.amber} size={112}>Citizenship Study</Neon>
        <Kicker text={t.how} at={28} color="#fff" style={{marginTop: 40}} />
      </div>
      <Sfx at={6} name="hit" volume={0.5} />
      <Sfx at={10} name="chime" volume={0.35} />
    </AbsoluteFill>
  );
};

/** The close: who made it (not USCIS), the two habits, the address. */
const Outro: React.FC<{s: Scene}> = ({s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = T[useLang()];
  const p = spring({frame: frame - 4, fps, config: {damping: 11, mass: 0.7}});
  const l1 = s.lines[1].start;
  const a = interpolate(frame, [l1 - 8, l1], [1, 0], clamp);
  const b = spring({frame: frame - l1, fps, config: {damping: 200}});
  const b2 = spring({frame: frame - fr(s, 1, 0.5), fps, config: {damping: 200}});
  return (
    <AbsoluteFill>
      <Backdrop src="mall-day" bright={0.6} />
      <div style={{position: 'absolute', left: 540 - 150, top: 300, width: 300, height: 300, transform: `scale(${p})`, WebkitBoxReflect: 'below 26px linear-gradient(transparent 70%, rgba(255,255,255,0.2))'} as React.CSSProperties}>
        <Img src={staticFile('icons/icon-512.png')} style={{width: 300, height: 300, borderRadius: 68, boxShadow: `0 0 ${60 + 25 * Math.sin(frame / 8)}px ${C.amber}`}} />
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 900, textAlign: 'center', opacity: a * p}}>
        <Neon color={PINK} size={84}>{t.notUscis}</Neon>
        <div style={{marginTop: 50, display: 'inline-block', background: '#fff', color: C.ink, fontFamily: FONT, fontWeight: 900, fontSize: 46, padding: '18px 34px', borderRadius: 40}}>{t.check}</div>
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 880, textAlign: 'center'}}>
        <Neon color={C.amber} size={88} style={{opacity: b, transform: `translateY(${(1 - b) * 30}px)`}}>{t.add}</Neon>
        <div style={{marginTop: 44, display: 'inline-block', background: C.amber, color: '#2b1a03', fontFamily: FONT, fontWeight: 900, fontSize: 56, padding: '14px 32px', borderRadius: 16, opacity: b2, transform: `translateY(${(1 - b2) * 30}px)`, boxShadow: `0 0 40px ${C.amber}88`}}>{t.daily}</div>
        <div style={{marginTop: 60, opacity: b2}}><span style={{fontFamily: '"DejaVu Sans Mono", monospace', fontSize: 30, color: '#fff', background: 'rgba(10,12,30,0.55)', border: '2px solid rgba(255,255,255,0.35)', padding: '14px 24px', borderRadius: 40}}>{ADDRESS}</span></div>
      </div>
      <Burst at={l1 + 4} x={540} y={450} n={24} />
      <Buddy enter={l1 + 10} hops={[fr(s, 1, 0.8)]} x={420} y={1440} h={240} />
      <Sfx at={4} name="hit" volume={0.45} />
      <Sfx at={l1 + 4} name="chime" volume={0.4} />
    </AbsoluteFill>
  );
};

/** Over the drill: guessed or missed comes back sooner, known waits 1, 3, 7, 14, then 30 days (js/srs.js). */
const SpacingCallout: React.FC<{s: Scene}> = ({s}) => {
  const frame = useCurrentFrame();
  const t = T[useLang()];
  const w = s.lines[2].start, r = fr(s, 2, 0.5);
  const o = interpolate(frame, [w, w + 10], [0, 1], clamp);
  if (frame < w) return null;
  const pill: React.CSSProperties = {borderRadius: 26, padding: '22px 26px', fontSize: 31, fontWeight: 900, textAlign: 'center'};
  return (
    <AbsoluteFill style={{background: `rgba(18,21,43,${0.66 * o})`, opacity: o, padding: '330px 30px 0', display: 'grid', alignContent: 'start', gap: 22, fontFamily: FONT}}>
      <div style={{...pill, background: '#FBE6E9', color: C.bad}}>{t.back}</div>
      {frame >= r && <div style={{...pill, background: '#DDF4EF', color: C.good}}>{t.wait}</div>}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center'}}>
        {t.days.map((x, i) => {
          const p = interpolate(frame, [r + 12 + i * 9, r + 20 + i * 9], [0, 1], clamp);
          return <div key={x} style={{opacity: p, transform: `scale(${0.6 + 0.4 * p})`, background: C.amber, color: '#2b1a03', borderRadius: 20, padding: '14px 20px', fontSize: 30, fontWeight: 900, boxShadow: `0 0 ${20 * p}px ${C.amber}`}}>{x}</div>;
        })}
      </div>
      {t.days.map((_, i) => <Sfx key={i} at={r + 12 + i * 9} name="tick" volume={0.35} />)}
      <Sfx at={w} name="buzz" volume={0.2} />
      <Sfx at={r} name="chime" volume={0.3} />
    </AbsoluteFill>
  );
};

const H = LY.home, HOME_BUTTONS = [{at: 0, y: 1130}]; // Home scrolled so the three big buttons show

function Visual({s, steps}: {s: Scene; steps: string[]}) {
  const P = (props: Omit<React.ComponentProps<typeof PhoneScene>, 's' | 'steps'>) => <PhoneScene s={s} steps={steps} {...props} />;
  switch (s.id) {
    case 'hook': return <Hook s={s} />;
    case 'title': return <Title s={s} />;
    case 'outro': return <Outro s={s} />;
    case 'ios': {
      const dots = fr(s, 1, 0.0), share = fr(s, 1, 0.3), sheet = fr(s, 1, 0.42), addRow = fr(s, 1, 0.8), form = fr(s, 1, 1) + 4, add = fr(s, 1, 1) + 20;
      return P({hops: [share, addRow, add], children: <SafariSteps dots={dots} share={share} sheet={sheet} addRow={addRow} form={form} add={add} />});
    }
    case 'android': {
      const dots = fr(s, 0, 0.42), pick = fr(s, 0, 0.7), dialog = fr(s, 0, 0.8), install = fr(s, 0, 1) + 4;
      return P({color: CYAN, hops: [dots, pick, install], children: <ChromeSteps dots={dots} pick={pick} dialog={dialog} install={install} />});
    }
    case 'icon':
      return P({hops: [fr(s, 0, 0.45)], children: <>
        <HomeScreen tap={fr(s, 0, 0.45)} glowFrom={0} />
        <FadeIn at={fr(s, 0, 0.55)}><Shot src="home" /></FadeIn>
      </>});
    case 'state': {
      const L = LY['place-find'], N = LY['place-nj'], pick = fr(s, 0, 0.2), nj = pick + 8;
      return P({hops: [8, pick, fr(s, 1, 0.5)],
        pops: [{at: fr(s, 0, 0.4), to: s.lines[1].start - 4, src: 'place-nj', x: 50, y: 440, w: 680, h: 620, dx: 150, dy: -30, scale: 1.22}],
        children: <>
          <Shot src="home" taps={[{at: 8, ...mid(H.place)}]} boxes={[box(H.place, 0, 14, 6)]} />
          <FadeIn at={16}><Shot src="place-find" boxes={[box(L.find, 18, pick, 6)]} taps={[{at: pick, ...mid(L.row)}]} /></FadeIn>
          <FadeIn at={nj}><Shot src="place-nj" boxes={[box(N.rep, s.lines[1].start, s.dur, 8)]} taps={[{at: fr(s, 1, 0.5), ...mid(N.rep)}]} /></FadeIn>
        </>});
    }
    case 'study': {
      const Q = LY['study-q'], A = LY['study-a'], E = LY['study-es'], row = fr(s, 0, 0.5), speak = fr(s, 0, 0.72), show = fr(s, 1, 0.12), esp = fr(s, 2, 0.12);
      return P({color: CYAN, hops: [8, row, speak, show, esp], children: <>
        <Shot src="home" cams={HOME_BUTTONS} taps={[{at: 8, ...mid(H.study)}]} />
        <FadeIn at={16}><Shot src="study-parts" boxes={[box(LY['study-parts'].row, fr(s, 0, 0.36), row, 6)]} taps={[{at: row, ...mid(LY['study-parts'].row)}]} /></FadeIn>
        <FadeIn at={row + 8}><Shot src="study-q" boxes={[box(Q.speak, speak - 12, s.lines[0].start + s.lines[0].dur + 6, 8)]} taps={[{at: speak, ...mid(Q.speak)}, {at: show, ...mid(Q.show)}]} /></FadeIn>
        <FadeIn at={show + 8}><Shot src="study-a" boxes={[box(A.answers, show + 14, esp - 6, 4)]} taps={[{at: esp, ...mid(A.spanish)}]} /></FadeIn>
        <FadeIn at={esp + 8}><Shot src="study-es" cams={[{at: 0, y: 844}, {at: esp + 40, y: 1122}]} boxes={[box(E.es, esp + 12, esp + 44, 8)]} /></FadeIn>
        {[speak, speak + 9].map((f) => <Sfx key={f} at={f} name="pop" volume={0.25} />)}
      </>});
    }
    case 'drill': {
      const D = LY['drill-q'], A = LY['drill-a'], show = fr(s, 0, 0.82), l1 = s.lines[1], seg = (p: number) => l1.start + Math.round(l1.dur * p);
      return P({hops: [8, show, seg(0.3), seg(0.55), seg(0.78)], children: <>
        <Shot src="home" cams={HOME_BUTTONS} taps={[{at: 8, ...mid(H.drill)}]} />
        <FadeIn at={16}><Shot src="drill-q" taps={[{at: show, ...mid(D.show)}]} /></FadeIn>
        <FadeIn at={show + 8}><Shot src="drill-a" boxes={[box(A.knew, seg(0.3), seg(0.55), 4), box(A.guessed, seg(0.55), seg(0.78), 4), box(A.missed, seg(0.78), s.lines[2].start, 4)]} /></FadeIn>
        <SpacingCallout s={s} />
      </>});
    }
    case 'mock': {
      const Q = LY['mock-q'], Y = LY['mock-typed'], G = LY['mock-right'], Z = LY['mock-pass'];
      const start = fr(s, 0, 0.3), mic = fr(s, 1, 0.12), typed = fr(s, 1, 0.35), check = fr(s, 1, 0.82), pass = fr(s, 2, 0.1);
      return P({color: CYAN, hops: [8, start, mic, check, pass + 10],
        pops: [{at: pass + 10, to: s.dur, src: 'mock-pass', x: 32, y: 160, w: 716, h: Z.score[1] + Z.score[3] - 140, dx: 110, dy: -120, scale: 1.25}],
        children: <>
          <Shot src="home" cams={HOME_BUTTONS} taps={[{at: 8, ...mid(H.mock)}]} />
          <FadeIn at={16}><Shot src="mock-start" taps={[{at: start, ...mid(LY['mock-start'].fresh)}]} /></FadeIn>
          <FadeIn at={start + 8}><Shot src="mock-q" boxes={[box(Q.q, start + 14, s.lines[1].start - 4, 8), box(Q.mic, s.lines[1].start, typed, 8)]} taps={[{at: mic, ...mid(Q.mic)}]} /></FadeIn>
          <FadeIn at={typed}><Shot src="mock-typed" boxes={[box(Y.answer, typed + 4, check - 8, 6)]} taps={[{at: check, ...mid(Y.check)}]} /></FadeIn>
          <FadeIn at={check + 8}><Shot src="mock-right" cams={[{at: 0, y: 844}, {at: check + 30, y: mid(G.sheet).y - 200}]} /></FadeIn>
          <FadeIn at={pass}><Shot src="mock-pass" /></FadeIn>
          <Sfx at={check + 10} name="chime" volume={0.3} />
          <Burst at={pass + 10} x={640} y={760} n={20} />
        </>});
    }
    case 'list': {
      const tap = fr(s, 0, 0.55), S6 = LY['home-6520'];
      return P({hops: [tap],
        pops: [{at: tap + 14, to: s.dur, src: 'home-6520', x: 50, y: S6.star[1] - 20, w: 680, h: S6.known[1] + S6.known[3] - S6.star[1] + 40, dx: 130, dy: -200, scale: 1.3}],
        children: <>
          <Shot src="home" boxes={[box(H.star, fr(s, 0, 0.42), tap, 6)]} taps={[{at: tap, ...mid(H.star)}]} />
          <FadeIn at={tap + 6}><Shot src="home-6520" /></FadeIn>
        </>});
    }
    case 'goal': {
      const M = LY.mall, l1 = s.lines[1].start, l2 = s.lines[2].start, open = l1 + 14;
      return P({hops: [fr(s, 0, 0.6), l1 + 4, l2 + 16],
        pops: [{at: fr(s, 0, 0.1), to: l1 - 6, src: 'home', x: H.today[0] + 16, y: H.today[1] + 10, w: H.today[2] - 32, h: H.week[1] + H.week[3] - H.today[1] + 10, dx: 120, dy: -330, scale: 1.25}],
        children: <>
          <Shot src="home" cams={[{at: 0, y: 1130}, {at: l1 - 6, y: 1130}, {at: l1 + 4, y: 1560}]} boxes={[box(H.week, fr(s, 0, 0.55), l1 - 6, 6)]} taps={[{at: l1 + 4, ...mid(H.strip)}]} />
          <FadeIn at={open}><Shot src="mall" cams={[{at: 0, y: 844}, {at: open + 16, y: 844}, {at: fr(s, 1, 0.9), y: mid(M.capitol).y}, {at: l2 - 4, y: mid(M.capitol).y}, {at: l2 + 20, y: mid(M.lincoln).y}]} boxes={[box(M.lincoln, l2 + 16, s.dur, 4)]} /></FadeIn>
          <Sfx at={l2 + 16} name="chime" volume={0.35} />
          <Burst at={l2 + 16} x={500} y={1050} n={20} />
        </>});
    }
    case 'backup': {
      const B = LY.backup, tap = fr(s, 0, 0.42), save = fr(s, 0, 0.62);
      return P({color: CYAN, hops: [tap, save], children: <>
        <Shot src="home" cams={[{at: 0, y: 1500}, {at: 20, y: 1732}]} boxes={[box(H.backup, 20, tap, 6)]} taps={[{at: tap, ...mid(H.backup)}]} />
        <FadeIn at={tap + 8}><Shot src="backup" boxes={[box(B.save, tap + 16, s.dur, 8)]} taps={[{at: save, ...mid(B.save)}]} /></FadeIn>
      </>});
    }
    default: return null;
  }
}

export const HowTo: React.FC<{lang: Lang}> = ({lang}) => {
  const frame = useCurrentFrame();
  const {scenes, total} = TL[lang];
  const steps = scenes.filter((s) => s.head[0]).map((s) => s.id);
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{fontFamily: FONT, background: '#0b0d1f'}}>
        <MusicBed total={total} />
        {scenes.map((s, n) => (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            {n === 0 ? <Visual s={s} steps={steps} /> : <WhipIn><Visual s={s} steps={steps} /></WhipIn>}
            {n > 0 && <Sfx at={0} name="whoosh" volume={0.4} />}
            {s.lines.map((l, i) => (
              <React.Fragment key={l.file}>
                <Sequence from={l.start} durationInFrames={l.dur + 2} name={l.file} layout="none">
                  <Audio src={staticFile(`voice/${l.file}`)} />
                </Sequence>
                <Sequence from={l.start - 3} durationInFrames={(s.lines[i + 1]?.start ?? s.dur) - l.start + 3} layout="none">
                  <WordSubs text={l.text} start={3} dur={l.dur} />
                </Sequence>
              </React.Fragment>
            ))}
          </Sequence>
        ))}
        <div style={{position: 'absolute', left: 0, top: 0, height: 6, width: `${(100 * frame) / total}%`, background: C.amber, boxShadow: `0 0 12px ${C.amber}`}} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
