import { useState } from 'react';
import { AutoRemediation } from '@/components/AutoRemediation';
import { Field, TextInput, Toggle } from '@/components/form';
import { Badge, Button, Card, Eyebrow, Icon, type IconName } from '@/components/ui';
import { SEV } from '@/data/services';
import type { Severity } from '@/types';

type Tab = 'rules' | 'automation' | 'channels' | 'general';

interface AlarmRule {
  id: string;
  metric: string;
  op: string;
  val: string;
  sev: Severity;
  on: boolean;
}

const INITIAL_RULES: AlarmRule[] = [
  { id: 'r1', metric: 'status', op: '==', val: 'exited', sev: 'critical', on: true },
  { id: 'r2', metric: 'restarts', op: '>', val: '5 / 10dk', sev: 'critical', on: true },
  { id: 'r3', metric: 'cpu', op: '>', val: '80% / 5dk', sev: 'warning', on: true },
  { id: 'r4', metric: 'memory', op: '>', val: '90%', sev: 'warning', on: true },
  { id: 'r5', metric: 'healthcheck', op: '==', val: 'fail', sev: 'warning', on: true },
  { id: 'r6', metric: 'disk', op: '>', val: '85%', sev: 'warning', on: false },
];

const RULE_COLS = '40px 1.4fr 0.6fr 1.2fr 1fr 50px';

/** Settings: alarm rules, auto-remediation, notification channels and general options. */
export function Settings() {
  const [tab, setTab] = useState<Tab>('rules');
  const [rules, setRules] = useState(INITIAL_RULES);
  const toggleRule = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));

  const tabs: Array<[Tab, string, IconName]> = [
    ['rules', 'Alarm kuralları', 'alert'],
    ['automation', 'Otomatik onarım', 'shield'],
    ['channels', 'Bildirim kanalları', 'bell'],
    ['general', 'Genel', 'settings'],
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Eyebrow>Yapılandırma</Eyebrow>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>Ayarlar</h1>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)' }}>
        {tabs.map(([k, l, ic]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 14px',
              fontSize: 13.5,
              fontWeight: 600,
              color: tab === k ? 'var(--tx-0)' : 'var(--tx-2)',
              borderBottom: `2px solid ${tab === k ? 'var(--acc)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            <Icon name={ic} size={15} />
            {l}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: RULE_COLS,
              columnGap: 14,
              padding: '11px 18px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--bg-1)',
            }}
          >
            {['', 'Metrik', 'Op', 'Eşik', 'Seviye', ''].map((h, i) => (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--tx-3)',
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {rules.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: RULE_COLS,
                columnGap: 14,
                alignItems: 'center',
                padding: '13px 18px',
                borderBottom: i === rules.length - 1 ? 'none' : '1px solid var(--line)',
                opacity: r.on ? 1 : 0.5,
              }}
            >
              <Toggle on={r.on} onClick={() => toggleRule(r.id)} />
              <span className="mono" style={{ fontSize: 13, color: 'var(--tx-0)', fontWeight: 600 }}>
                {r.metric}
              </span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--acc-2)' }}>
                {r.op}
              </span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--tx-1)' }}>
                {r.val}
              </span>
              <div>
                <Badge color={SEV[r.sev].color} bg={SEV[r.sev].soft} line={SEV[r.sev].line}>
                  {SEV[r.sev].label}
                </Badge>
              </div>
              <button style={{ color: 'var(--tx-3)', justifySelf: 'end' }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
          <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
            <Button variant="soft" icon="plus" size="sm">
              Kural ekle
            </Button>
          </div>
        </Card>
      )}

      {tab === 'automation' && <AutoRemediation />}

      {tab === 'channels' && <ChannelsTab />}

      {tab === 'general' && <GeneralTab />}
    </div>
  );
}

function ChannelsTab() {
  const others: Array<[string, IconName]> = [
    ['E-posta', 'bell'],
    ['Telegram', 'bell'],
    ['Webhook', 'external'],
    ['PagerDuty', 'shield'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card pad={20} glow>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--acc-soft)',
                color: 'var(--acc)',
                flexShrink: 0,
              }}
            >
              <Icon name="slack" size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Slack</span>
                <Badge color="var(--ok)" bg="var(--ok-soft)" line="var(--ok-line)" dot>
                  bağlı
                </Badge>
              </div>
              <div className="mono" style={{ fontSize: 12.5, color: 'var(--tx-2)', marginTop: 5 }}>
                workspace: <span style={{ color: 'var(--tx-1)' }}>acme-eng</span> · kanal:{' '}
                <span style={{ color: 'var(--acc-2)' }}>#alerts-prod</span>
              </div>
            </div>
          </div>
          <Toggle on onClick={() => {}} />
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Field label="Kritik alarmlar → kanal">
            <TextInput value="#alerts-prod" onChange={() => {}} mono prefix="#" />
          </Field>
          <Field label="Uyarılar → kanal">
            <TextInput value="#alerts-warn" onChange={() => {}} mono prefix="#" />
          </Field>
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            borderRadius: 9,
            background: 'var(--bg-1)',
            border: '1px solid var(--line)',
          }}
        >
          <Toggle on onClick={() => {}} />
          <span style={{ fontSize: 12.5, color: 'var(--tx-1)' }}>@here ile kritik alarmları etiketle</span>
        </div>
      </Card>
      {others.map(([n, ic]) => (
        <Card key={n} pad={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--panel-hi)',
                  color: 'var(--tx-3)',
                  border: '1px solid var(--line-2)',
                }}
              >
                <Icon name={ic} size={19} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx-1)' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>bağlı değil</div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Bağla
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GeneralTab() {
  const rows: Array<[string, string, string]> = [
    ['Veri saklama süresi', 'Metrik geçmişi ne kadar tutulsun', '30 gün'],
    ['Toplama aralığı', 'Varsayılan polling sıklığı', '30 sn'],
    ['Sessiz saatler', '22:00 – 07:00 yalnızca kritik', 'açık'],
    ['Otomatik onarım', 'Restart loop’ta compose restart dene', 'kapalı'],
  ];
  return (
    <Card pad={22}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(([t, d, v], i) => (
          <div
            key={t}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '15px 0',
              borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 2 }}>{d}</div>
            </div>
            {v === 'açık' || v === 'kapalı' ? (
              <Toggle on={v === 'açık'} onClick={() => {}} />
            ) : (
              <span
                className="mono"
                style={{
                  fontSize: 13,
                  color: 'var(--tx-1)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line-2)',
                }}
              >
                {v}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
