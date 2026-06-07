import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { paths } from '@/lib/routes';

/** Fallback screen for unmatched routes. */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <Card pad={48}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--panel-hi)',
            border: '1px solid var(--line-2)',
            color: 'var(--tx-2)',
          }}
        >
          <Icon name="search" size={22} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Sayfa bulunamadı</div>
          <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4 }}>
            Aradığınız kaynak taşınmış veya hiç var olmamış olabilir.
          </div>
        </div>
        <Button variant="primary" icon="grid" onClick={() => navigate(paths.overview())}>
          Genel bakışa dön
        </Button>
      </div>
    </Card>
  );
}
