import {Composition} from 'remotion';
import {HowTo} from './HowTo';
import {FPS, TL} from './timeline';

// Vertical 1080 x 1920 at 30 fps, for phones, once per language. Length follows the narration.
export const Root = () => (
  <>
    <Composition id="HowToEn" component={HowTo} defaultProps={{lang: 'en' as const}} durationInFrames={TL.en.total} fps={FPS} width={1080} height={1920} />
    <Composition id="HowToEs" component={HowTo} defaultProps={{lang: 'es' as const}} durationInFrames={TL.es.total} fps={FPS} width={1080} height={1920} />
  </>
);
