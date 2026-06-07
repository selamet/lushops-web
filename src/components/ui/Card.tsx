import { useState, type CSSProperties, type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  hover?: boolean;
  onClick?: () => void;
  glow?: boolean;
}

/** Panel surface with optional hover lift and accent glow. */
export function Card({ children, style, pad = 18, hover, onClick, glow }: CardProps) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
        border: `1px solid ${h && hover ? 'var(--line-3)' : 'var(--line)'}`,
        borderRadius: 'var(--radius)',
        padding: pad,
        transition: 'border-color .18s, transform .18s, box-shadow .18s',
        cursor: onClick ? 'pointer' : 'default',
        transform: h && hover ? 'translateY(-2px)' : 'none',
        boxShadow:
          h && hover
            ? 'var(--shadow-2)'
            : glow
              ? '0 0 0 1px var(--acc-line), 0 0 30px -8px var(--acc-glow)'
              : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
