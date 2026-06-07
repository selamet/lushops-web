import { STATUS } from '@/data/services';
import type { StatusKey } from '@/types';
import { StatusDot } from './StatusDot';

interface StatusPillProps {
  status: StatusKey;
  pulse?: boolean;
}

/** Monospace status pill driven by the STATUS color map. */
export function StatusPill({ status, pulse }: StatusPillProps) {
  const s = STATUS[status] || STATUS.paused;
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '3px 10px 3px 8px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        color: s.color,
        background: s.soft,
        border: `1px solid ${s.line}`,
        whiteSpace: 'nowrap',
      }}
    >
      <StatusDot
        color={s.color}
        size={7}
        pulse={pulse && status !== 'exited'}
        glow={pulse && status === 'running' ? 'rgba(52,211,153,0.0)' : null}
      />
      {s.label}
    </span>
  );
}
