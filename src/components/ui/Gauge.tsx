interface GaugeProps {
  value: number;
  color?: string;
  size?: number;
  label?: string;
  sub?: string;
}

/** Radial percentage gauge with an optional label. */
export function Gauge({ value, color = 'var(--acc)', size = 56, label, sub }: GaugeProps) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(value, 100) / 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="5" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={c}
            strokeDashoffset={off}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.2,.7,.3,1)' }}
          />
        </svg>
        <div
          className="mono"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: size * 0.24,
            fontWeight: 700,
            color: 'var(--tx-0)',
          }}
        >
          {Math.round(value)}
          <span style={{ fontSize: size * 0.13, color: 'var(--tx-2)' }}>%</span>
        </div>
      </div>
      {label && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
          {sub && <div style={{ color: 'var(--tx-2)', fontSize: 12 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}
