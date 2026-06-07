import { useNavigate } from 'react-router-dom';
import { Button, Icon, StatusDot } from '@/components/ui';
import { paths } from '@/lib/routes';
import type { Alarm } from '@/types';

interface CriticalBannerProps {
  alarms: Alarm[];
  onDismiss: () => void;
}

/** Red banner under the topbar summarizing active critical alarms. */
export function CriticalBanner({ alarms, onDismiss }: CriticalBannerProps) {
  const navigate = useNavigate();
  const first = alarms[0];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '11px 26px',
        background: 'linear-gradient(90deg, rgba(245,85,109,0.16), rgba(245,85,109,0.06))',
        borderBottom: '1px solid var(--crit-line)',
        animation: 'bannerIn .35s ease both',
      }}
    >
      <StatusDot color="var(--crit)" size={9} pulse glow="rgba(245,85,109,0.0)" />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-0)' }}>
        {alarms.length} kritik alarm aktif —
        <span className="mono" style={{ color: 'var(--crit)', margin: '0 6px' }}>
          {first.container}
        </span>
        {first.title}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <Button variant="danger" size="sm" onClick={() => navigate(paths.alarms())}>
          Alarmları gör
        </Button>
        <button
          onClick={onDismiss}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--tx-2)',
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}
