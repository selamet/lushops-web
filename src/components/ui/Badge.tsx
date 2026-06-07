import type { CSSProperties, ReactNode } from 'react';
import { StatusDot } from './StatusDot';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  line?: string;
  dot?: boolean;
  style?: CSSProperties;
}

/** Pill-shaped label, optionally led by a status dot. */
export function Badge({
  children,
  color = 'var(--tx-1)',
  bg = 'var(--muted-soft)',
  line,
  dot,
  style,
}: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${line || 'transparent'}`,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {dot && <StatusDot color={color} size={6} />}
      {children}
    </span>
  );
}
