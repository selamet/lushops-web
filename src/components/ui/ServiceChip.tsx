import { SERVICES } from '@/data/services';
import type { ServiceType } from '@/types';

interface ServiceChipProps {
  svc: ServiceType;
  size?: number;
  showLabel?: boolean;
}

/** Monogram chip for a service type, optionally with its label. */
export function ServiceChip({ svc, size = 28, showLabel }: ServiceChipProps) {
  const m = SERVICES[svc] || {
    mono: '??',
    color: 'var(--tx-2)',
    tint: 'var(--muted-soft)',
    label: svc,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span
        className="mono"
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: size * 0.36,
          fontWeight: 700,
          color: m.color,
          background: m.tint,
          border: `1px solid ${m.color}28`,
          letterSpacing: 0,
        }}
      >
        {m.mono}
      </span>
      {showLabel && <span style={{ fontWeight: 600, color: 'var(--tx-1)' }}>{m.label}</span>}
    </span>
  );
}
