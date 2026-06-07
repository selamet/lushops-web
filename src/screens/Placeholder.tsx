import { Card } from '@/components/ui';

/** Temporary stand-in for screens that are not yet implemented. */
export function Placeholder({ title }: { title: string }) {
  return (
    <Card pad={40}>
      <div style={{ textAlign: 'center', color: 'var(--tx-3)' }}>{title} — yakında</div>
    </Card>
  );
}
