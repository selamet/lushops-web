import { useEffect, useState } from 'react';
import { Toggle } from '@/components/form';
import { Button, Card, Icon } from '@/components/ui';
import { api } from '@/api/endpoints';
import { relativeTime } from '@/api/map';
import type { ApiRemediationRule } from '@/api/types';

/** Auto-remediation rules tab: condition → action cards with run counters. */
export function AutoRemediation() {
  const [rules, setRules] = useState<ApiRemediationRule[]>([]);

  useEffect(() => {
    api.listRemediationRules().then(setRules).catch(() => undefined);
  }, []);

  const toggle = async (rule: ApiRemediationRule) => {
    const updated = await api.updateRemediationRule(rule.id, { enabled: !rule.enabled });
    setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

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
        <Card key={r.id} pad={0} style={{ overflow: 'hidden', opacity: r.enabled ? 1 : 0.55 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px' }}>
            <Toggle on={r.enabled} onClick={() => toggle(r)} />
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
                  EĞER {r.condition}
                </span>
                <Icon name="arrowRight" size={15} color="var(--tx-3)" />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.action}</span>
              </div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--tx-3)', marginTop: 8 }}>
                $ {r.command}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                className="mono tnum"
                style={{ fontSize: 16, fontWeight: 700, color: r.runCount > 0 ? 'var(--acc)' : 'var(--tx-3)' }}
              >
                {r.runCount}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--tx-3)' }}>
                çalıştı · {r.lastRunAt ? relativeTime(r.lastRunAt) : '—'}
              </div>
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
