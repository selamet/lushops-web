import { useEffect, useState } from 'react';
import { AutoRemediation } from '@/components/AutoRemediation';
import { Field, TextInput, Toggle } from '@/components/form';
import { Badge, Button, Card, Eyebrow, Icon, type IconName } from '@/components/ui';
import { SEV } from '@/data/services';
import { api } from '@/api/endpoints';
import { useOrgs } from '@/store/orgs';
import { useOverlay } from '@/store/overlay';
import type { ApiAlarmRule, ApiChannel, ApiMember, ApiSettings, OrgRole } from '@/api/types';
import type { ApiError } from '@/api/client';

type Tab = 'rules' | 'automation' | 'channels' | 'organization' | 'general';

const RULE_COLS = '40px 1.4fr 0.6fr 1.2fr 1fr 50px';

/** Settings: alarm rules, auto-remediation, notification channels, organization and general options. */
export function Settings() {
  const [tab, setTab] = useState<Tab>('rules');

  const tabs: Array<[Tab, string, IconName]> = [
    ['rules', 'Alarm kuralları', 'alert'],
    ['automation', 'Otomatik onarım', 'shield'],
    ['channels', 'Bildirim kanalları', 'bell'],
    ['organization', 'Organizasyon', 'layers'],
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

      {tab === 'rules' && <RulesTab />}
      {tab === 'automation' && <AutoRemediation />}
      {tab === 'channels' && <ChannelsTab />}
      {tab === 'organization' && <OrganizationTab />}
      {tab === 'general' && <GeneralTab />}
    </div>
  );
}

const MEMBER_COLS = '1.4fr 1.6fr 0.8fr 40px';

/** Manage the active organization's members. Owners can add, re-role and remove. */
function OrganizationTab() {
  const toast = useOverlay((s) => s.toast);
  const orgs = useOrgs((s) => s.orgs);
  const activeId = useOrgs((s) => s.activeId);
  const setActive = useOrgs((s) => s.setActive);
  const loadOrgs = useOrgs((s) => s.load);

  const [members, setMembers] = useState<ApiMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [busy, setBusy] = useState(false);

  const org = orgs.find((o) => o.id === activeId) ?? orgs[0];
  const isOwner = org?.role === 'owner';

  useEffect(() => {
    if (!orgs.length) loadOrgs();
  }, [orgs.length, loadOrgs]);

  useEffect(() => {
    if (!org) return;
    api
      .listMembers(org.id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [org?.id]);

  const addMember = async () => {
    if (!org || busy || !email.trim()) return;
    setBusy(true);
    try {
      const member = await api.addMember(org.id, { email: email.trim(), role });
      setMembers((m) => [...m, member]);
      setEmail('');
      toast('Üye eklendi', { type: 'success', sub: member.email });
    } catch (e) {
      toast('Üye eklenemedi', { type: 'error', sub: (e as ApiError).message });
    }
    setBusy(false);
  };

  const changeRole = async (member: ApiMember, next: OrgRole) => {
    if (!org) return;
    try {
      const updated = await api.updateMember(org.id, member.id, next);
      setMembers((m) => m.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast('Rol değiştirilemedi', { type: 'error', sub: (e as ApiError).message });
    }
  };

  const removeMember = async (member: ApiMember) => {
    if (!org) return;
    try {
      await api.removeMember(org.id, member.id);
      setMembers((m) => m.filter((x) => x.id !== member.id));
    } catch (e) {
      toast('Üye çıkarılamadı', { type: 'error', sub: (e as ApiError).message });
    }
  };

  if (!org) {
    return (
      <Card pad={20}>
        <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>Organizasyon yükleniyor…</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {orgs.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => setActive(o.id)}
              style={{
                padding: '8px 13px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                color: o.id === org.id ? 'var(--acc)' : 'var(--tx-2)',
                background: o.id === org.id ? 'var(--acc-soft)' : 'var(--bg-1)',
                border: `1px solid ${o.id === org.id ? 'var(--acc-line)' : 'var(--line-2)'}`,
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: MEMBER_COLS,
            columnGap: 14,
            padding: '11px 18px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-1)',
          }}
        >
          {['Ad', 'E-posta', 'Rol', ''].map((h, i) => (
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
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'grid',
              gridTemplateColumns: MEMBER_COLS,
              columnGap: 14,
              alignItems: 'center',
              padding: '13px 18px',
              borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: 13.5, color: 'var(--tx-0)', fontWeight: 600 }}>{m.fullName}</span>
            <span className="mono" style={{ fontSize: 12.5, color: 'var(--tx-2)' }}>
              {m.email}
            </span>
            {isOwner ? (
              <select
                value={m.role}
                onChange={(e) => changeRole(m, e.target.value as OrgRole)}
                style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 8,
                  padding: '6px 9px',
                  color: 'var(--tx-1)',
                  fontSize: 12.5,
                }}
              >
                <option value="owner">owner</option>
                <option value="member">member</option>
              </select>
            ) : (
              <Badge color="var(--tx-2)" bg="var(--panel-hi)" line="var(--line-2)">
                {m.role}
              </Badge>
            )}
            {isOwner ? (
              <button onClick={() => removeMember(m)} style={{ color: 'var(--tx-3)', justifySelf: 'end' }}>
                <Icon name="trash" size={15} />
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
        {isOwner && (
          <div
            style={{
              padding: 16,
              borderTop: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.8fr auto',
              gap: 10,
              alignItems: 'end',
            }}
          >
            <Field label="E-posta ile üye ekle" hint="kayıtlı kullanıcı">
              <TextInput value={email} onChange={setEmail} placeholder="teammate@company.com" mono />
            </Field>
            <Field label="Rol">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                style={{
                  width: '100%',
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 9,
                  padding: '11px 12px',
                  color: 'var(--tx-1)',
                  fontSize: 13,
                }}
              >
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
            </Field>
            <Button variant="primary" icon="plus" onClick={addMember}>
              {busy ? 'Ekleniyor…' : 'Ekle'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function RulesTab() {
  const toast = useOverlay((s) => s.toast);
  const [rules, setRules] = useState<ApiAlarmRule[]>([]);

  useEffect(() => {
    api.listAlarmRules().then(setRules).catch(() => undefined);
  }, []);

  const toggleRule = async (rule: ApiAlarmRule) => {
    const updated = await api.updateAlarmRule(rule.id, { enabled: !rule.enabled });
    setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

  const removeRule = async (id: string) => {
    await api.deleteAlarmRule(id);
    setRules((rs) => rs.filter((r) => r.id !== id));
  };

  const addRule = async () => {
    const created = await api.createAlarmRule({
      metric: 'cpu',
      operator: '>',
      threshold: '80% / 5m',
      severity: 'warning',
      enabled: true,
    });
    setRules((rs) => [...rs, created]);
    toast('Kural eklendi', { type: 'success' });
  };

  return (
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
            opacity: r.enabled ? 1 : 0.5,
          }}
        >
          <Toggle on={r.enabled} onClick={() => toggleRule(r)} />
          <span className="mono" style={{ fontSize: 13, color: 'var(--tx-0)', fontWeight: 600 }}>
            {r.metric}
          </span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--acc-2)' }}>
            {r.operator}
          </span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--tx-1)' }}>
            {r.threshold}
          </span>
          <div>
            <Badge color={SEV[r.severity].color} bg={SEV[r.severity].soft} line={SEV[r.severity].line}>
              {SEV[r.severity].label}
            </Badge>
          </div>
          <button onClick={() => removeRule(r.id)} style={{ color: 'var(--tx-3)', justifySelf: 'end' }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
        <Button variant="soft" icon="plus" size="sm" onClick={addRule}>
          Kural ekle
        </Button>
      </div>
    </Card>
  );
}

function ChannelsTab() {
  const [channels, setChannels] = useState<ApiChannel[]>([]);

  useEffect(() => {
    api.listChannels().then(setChannels).catch(() => undefined);
  }, []);

  const slack = channels.find((c) => c.type === 'slack');
  const config = (slack?.config ?? {}) as Record<string, string>;

  const toggleSlack = async () => {
    if (!slack) return;
    const updated = await api.updateChannel(slack.id, { enabled: !slack.enabled });
    setChannels((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
  };

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
                {slack?.enabled && (
                  <Badge color="var(--ok)" bg="var(--ok-soft)" line="var(--ok-line)" dot>
                    bağlı
                  </Badge>
                )}
              </div>
              <div className="mono" style={{ fontSize: 12.5, color: 'var(--tx-2)', marginTop: 5 }}>
                workspace: <span style={{ color: 'var(--tx-1)' }}>{config.workspace ?? '—'}</span> · kanal:{' '}
                <span style={{ color: 'var(--acc-2)' }}>{config.criticalChannel ?? '—'}</span>
              </div>
            </div>
          </div>
          <Toggle on={!!slack?.enabled} onClick={toggleSlack} />
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
            <TextInput value={config.criticalChannel ?? ''} onChange={() => {}} mono prefix="#" />
          </Field>
          <Field label="Uyarılar → kanal">
            <TextInput value={config.warningChannel ?? ''} onChange={() => {}} mono prefix="#" />
          </Field>
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
  const [settings, setSettings] = useState<ApiSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => undefined);
  }, []);

  const patch = async (body: Partial<ApiSettings>) => {
    setSettings(await api.updateSettings(body));
  };

  if (!settings) return null;

  const textRows: Array<[string, string, string]> = [
    ['Veri saklama süresi', 'Metrik geçmişi ne kadar tutulsun', `${settings.dataRetentionDays} gün`],
    ['Toplama aralığı', 'Varsayılan polling sıklığı', `${settings.defaultInterval} sn`],
  ];
  const toggleRows: Array<[string, string, boolean, () => void]> = [
    [
      'Sessiz saatler',
      `${settings.quietHoursStart} – ${settings.quietHoursEnd} yalnızca kritik`,
      settings.quietHoursEnabled,
      () => patch({ quietHoursEnabled: !settings.quietHoursEnabled }),
    ],
    [
      'Otomatik onarım',
      'Restart loop’ta compose restart dene',
      settings.autoRemediationEnabled,
      () => patch({ autoRemediationEnabled: !settings.autoRemediationEnabled }),
    ],
  ];

  return (
    <Card pad={22}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {textRows.map(([t, d, v]) => (
          <Row key={t} title={t} desc={d}>
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
          </Row>
        ))}
        {toggleRows.map(([t, d, on, onClick], i) => (
          <Row key={t} title={t} desc={d} last={i === toggleRows.length - 1}>
            <Toggle on={on} onClick={onClick} />
          </Row>
        ))}
      </div>
    </Card>
  );
}

function Row({
  title,
  desc,
  children,
  last,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 0',
        borderBottom: last ? 'none' : '1px solid var(--line)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 2 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}
