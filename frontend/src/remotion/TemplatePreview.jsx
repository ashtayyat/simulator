import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';

export default function TemplatePreview({ title, bullets }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg,#0c4a6e,#1d4ed8)',
      color: 'white',
      padding: 40,
      fontFamily: 'Inter, sans-serif',
      opacity
    }}>
      <h2 style={{ fontSize: 42 }}>{title}</h2>
      <Sequence from={15}>
        <ul style={{ fontSize: 24, lineHeight: 1.6 }}>
          {bullets.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Sequence>
    </AbsoluteFill>
  );
}
