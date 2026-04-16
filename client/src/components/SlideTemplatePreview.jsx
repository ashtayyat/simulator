import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { Player } from '@remotion/player';

function DeckComposition({ title = 'PowerPoint Template', subtitle = 'Office Simulator' }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'Arial' }}>
      <Sequence from={0} durationInFrames={90}>
        <div style={{ padding: 40, opacity }}>
          <h1 style={{ fontSize: 54 }}>{title}</h1>
          <p style={{ fontSize: 28 }}>{subtitle}</p>
        </div>
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <div style={{ padding: 40 }}>
          <h2 style={{ fontSize: 44 }}>Agenda</h2>
          <ul style={{ fontSize: 28, lineHeight: 1.8 }}>
            <li>Word Formatting</li>
            <li>Excel Formulas</li>
            <li>PowerPoint Storytelling</li>
          </ul>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}

export default function SlideTemplatePreview({ title, subtitle }) {
  return (
    <Player
      component={DeckComposition}
      inputProps={{ title, subtitle }}
      durationInFrames={180}
      fps={30}
      compositionWidth={960}
      compositionHeight={540}
      controls
      style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
    />
  );
}
