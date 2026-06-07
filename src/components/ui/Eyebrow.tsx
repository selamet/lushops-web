import type { CSSProperties, ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  style?: CSSProperties;
}

/** Uppercase monospace section label. */
export function Eyebrow({ children, style }: EyebrowProps) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--tx-3)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
