import { useState } from 'react';
import { Toggle } from '@/components/form';
import { Button, Card, Icon } from '@/components/ui';

interface RemediationRule {
  id: string;
  on: boolean;
  when: string;
  action: string;
  cmd: string;
  runs: number;
  last: string;
}

const INITIAL_RULES: RemediationRule[] = [
  { id: 'ar1', on: true, when: 'status == exited & OOMKilled', action: 'Bellek limitini %25 artır + recreate', cmd: 'compose up -d --force-recreate', runs: 3, last: '2 dk önce' },
  { id: 'ar2', on: true, when: 'restarts > 5 / 10dk', action: 'Son sağlıklı image’a rollback', cmd: 'compose pull <prev> && up -d', runs: 1, last: 'dün' },
  { id: 'ar3', on: false, when: 'cpu > 95% / 10dk', action: 'Replica sayısını 1 artır (scale)', cmd: 'compose up -d --scale api=+1', runs: 0, last: '—' },
  { id: 'ar4', on: true, when: 'healthcheck fail x3', action: 'Container’ı yeniden başlat', cmd: 'docker restart <name>', runs: 7, last: '5 dk önce' },
];

/** Auto-remediation rules tab: condition → action cards with run counters. */
export function AutoRemediation() {
  const [rules, setRules] = useState(INITIAL_RULES);
  const toggle = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card
        pad={16}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          background: 'var(--acc-soft)',
          borderColor: 'var(--acc-line)',
        }}
      >
        <Icon name="shield" size={20} color="var(--acc)" />
        <div style={{ fontSize: 12.5, color: 'var(--tx-1)', lineHeight: 1.5 }}>
          Otomatik onarım, alarm tetiklendiğinde tanımlı düzeltmeyi{' '}
          <b style={{ color: 'var(--tx-0)' }}>otomatik</b> uygular ve her denemeyi olay zaman
          çizelgesine + Slack’e yazar. Başarısız olursa kritik alarm yükseltilir.
        </div>
      </Card>
      {rules.map((r) => (
        <Card key={r.id} pad={0} style={{ overflow: 'hidden', opacity: r.on ? 1 : 0.55 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px' }}>
            <Toggle on={r.on} onClick={() => toggle(r.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 11.5,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'var(--warn-soft)',
                    color: 'var(--warn)',
                    border: '1px solid var(--warn-line)',
                  }}
                >
                  EĞER {r.when}
                </span>
                <Icon name="arrowRight" size={15} color="var(--tx-3)" />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.action}</span>
              </div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--tx-3)', marginTop: 8 }}>
                $ {r.cmd}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                className="mono tnum"
                style={{ fontSize: 16, fontWeight: 700, color: r.runs > 0 ? 'var(--acc)' : 'var(--tx-3)' }}
              >
                {r.runs}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--tx-3)' }}>çalıştı · {r.last}</div>
            </div>
          </div>
        </Card>
      ))}
      <Button variant="soft" icon="plus" size="sm" style={{ alignSelf: 'flex-start' }}>
        Otomasyon kuralı ekle
      </Button>
    </div>
  );
}
