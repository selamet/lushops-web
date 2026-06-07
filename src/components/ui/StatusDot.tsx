import type { CSSProperties } from 'react';

interface StatusDotProps {
  color?: string;
  glow?: string | null;
  size?: number;
  pulse?: boolean;
}

/** Small filled dot, optionally pulsing with a colored glow. */
export function StatusDot({ color = 'var(--ok)', glow, size = 8, pulse }: StatusDotProps) {
  const style: CSSProperties & { '--glow'?: string } = {
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    boxShadow: glow ? `0 0 0 3px ${glow}` : 'none',
    animation: pulse ? 'pulseDot 2s infinite' : 'none',
    '--glow': glow ?? undefined,
  };
  return <span style={style} />;
}
