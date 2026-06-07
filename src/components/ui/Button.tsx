import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children?: ReactNode;
  icon?: IconName;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  style?: CSSProperties;
  active?: boolean;
}

/** Primary action button with hover/active states across four variants. */
export function Button({
  children,
  icon,
  variant = 'ghost',
  size = 'md',
  onClick,
  style,
  active,
}: ButtonProps) {
  const [h, setH] = useState(false);
  const pad = size === 'sm' ? '6px 11px' : size === 'lg' ? '11px 18px' : '8px 14px';
  const fs = size === 'sm' ? 12.5 : 13.5;

  const variants: Record<Variant, { bg: string; col: string; bd: string; sh: string }> = {
    primary: {
      bg: h ? 'var(--acc-2)' : 'var(--acc)',
      col: '#fff',
      bd: 'transparent',
      sh: h ? '0 6px 20px -6px var(--acc-glow)' : '0 1px 2px rgba(0,0,0,.3)',
    },
    ghost: {
      bg: h ? 'var(--panel-hi)' : 'var(--panel)',
      col: 'var(--tx-1)',
      bd: h ? 'var(--line-3)' : 'var(--line-2)',
      sh: 'none',
    },
    soft: {
      bg: h ? 'var(--panel-hi)' : 'transparent',
      col: 'var(--tx-1)',
      bd: 'transparent',
      sh: 'none',
    },
    danger: {
      bg: h ? 'rgba(245,85,109,0.18)' : 'var(--crit-soft)',
      col: 'var(--crit)',
      bd: 'var(--crit-line)',
      sh: 'none',
    },
  };
  const base = variants[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--acc)' : base.col,
        background: active ? 'var(--acc-soft)' : base.bg,
        border: `1px solid ${active ? 'var(--acc-line)' : base.bd}`,
        boxShadow: base.sh,
        transition: 'all .16s',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
    </button>
  );
}
