import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, TextInput, Toggle } from '@/components/form';
import { Button, Card, Eyebrow, Icon, type IconName } from '@/components/ui';
import { api } from '@/api/endpoints';
import { provisionScript } from '@/lib/agentScript';
import { paths } from '@/lib/routes';
import { useFleet } from '@/store/fleet';
import { useOrgs } from '@/store/orgs';
import { useOverlay } from '@/store/overlay';
import type { ApiError } from '@/api/client';
import type { AuthMethod, CloudProvider } from '@/api/types';
import type { Environment } from '@/types';

interface FormState {
  organizationId: string;
  name: string;
  desc: string;
  env: Environment;
  provider: CloudProvider;
  instance: string;
  zone: string;
  project: string;
  auth: AuthMethod;
  keyRef: string;
  composePath: string;
  interval: string;
}

const STEPS = ['Uygulama', 'Bulut bağlantısı', 'Docker & izleme'];

const PROVIDERS: Array<[CloudProvider, string]> = [
  ['gcp', 'Google Cloud'],
  ['aws', 'AWS'],
  ['azure', 'Azure'],
  ['other', 'Diğer'],
];

interface ProviderConfig {
  projectLabel: string;
  projectPlaceholder: string;
  auth: Array<[AuthMethod, string, IconName]>;
  /** Short field hints shown next to each input. */
  hints: { project: string; instance: string; zone: string };
  /** "Where do I find this?" rows: [label, command/explanation]. */
  help: Array<[string, string]>;
  /** SSH private-key path hint + the command that produces it. */
  keyHelp: string;
}

/** Per-provider labels, auth methods and where-to-find guidance. */
const PROVIDER_CONFIG: Record<CloudProvider, ProviderConfig> = {
  gcp: {
    projectLabel: 'GCP Projesi',
    projectPlaceholder: 'my-gcp-project-prod',
    auth: [
      ['sa', 'Service Account', 'shield'],
      ['ssh', 'SSH anahtarı', 'terminal'],
      ['iap', 'IAP tünel', 'net'],
    ],
    hints: { project: 'proje ID', instance: 'VM adı', zone: 'ör. europe-west3-a' },
    help: [
      ['Proje ID', 'gcloud projects list  •  Console → üst menü proje seçici'],
      ['VM Instance & Zone', 'gcloud compute instances list  •  Console → Compute Engine → VM instances'],
      ['Service Account e-postası', 'gcloud iam service-accounts list'],
    ],
    keyHelp: 'gcloud compute ssh <instance> --zone <zone> → anahtar ~/.ssh/google_compute_engine olarak oluşur',
  },
  aws: {
    projectLabel: 'AWS Hesabı / Account ID',
    projectPlaceholder: '123456789012',
    auth: [
      ['iam', 'IAM rolü', 'shield'],
      ['ssh', 'SSH anahtarı', 'terminal'],
    ],
    hints: { project: '12 haneli hesap no', instance: 'Instance ID / Name', zone: 'ör. eu-west-1a' },
    help: [
      ['Account ID', 'aws sts get-caller-identity --query Account  •  Console → sağ üst hesap menüsü'],
      ['Instance & AZ', 'aws ec2 describe-instances  •  Console → EC2 → Instances'],
      ['IAM rolü', 'aws iam list-roles  •  Console → IAM → Roles'],
    ],
    keyHelp: 'EC2 key pair’i oluştururken indirdiğin .pem dosyası, ör. ~/.ssh/my-ec2-key.pem',
  },
  azure: {
    projectLabel: 'Azure Subscription',
    projectPlaceholder: 'acme-prod-subscription',
    auth: [
      ['sp', 'Service Principal', 'shield'],
      ['ssh', 'SSH anahtarı', 'terminal'],
    ],
    hints: { project: 'subscription ID', instance: 'VM adı', zone: 'ör. westeurope' },
    help: [
      ['Subscription ID', 'az account show --query id  •  Portal → Subscriptions'],
      ['VM & Bölge', 'az vm list -o table  •  Portal → Virtual machines'],
      ['Service Principal', 'az ad sp list --show-mine'],
    ],
    keyHelp: 'az vm create --generate-ssh-keys ile üretilen ~/.ssh/id_rsa',
  },
  other: {
    projectLabel: 'Proje / Hesap',
    projectPlaceholder: 'my-account',
    auth: [
      ['key', 'API anahtarı', 'shield'],
      ['ssh', 'SSH anahtarı', 'terminal'],
    ],
    hints: { project: 'proje/hesap adı', instance: 'sunucu adı', zone: 'bölge' },
    help: [
      ['Sunucu & bölge', 'Sağlayıcı panelinden makine adını ve bölgesini al'],
      ['SSH erişimi', 'ssh-keygen -t ed25519 -f ~/.ssh/lushops_key ile anahtar üret'],
    ],
    keyHelp: 'Sunucuya SSH yetkisi verdiğin özel anahtarın yolu, ör. ~/.ssh/lushops_key',
  },
};

/** Three-step wizard to register a new monitored app. */
export function AddApp() {
  const navigate = useNavigate();
  const refresh = useFleet((s) => s.refresh);
  const toast = useOverlay((s) => s.toast);
  const orgs = useOrgs((s) => s.orgs);
  const activeOrgId = useOrgs((s) => s.activeId);
  const loadOrgs = useOrgs((s) => s.load);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    organizationId: '',
    name: '',
    desc: '',
    env: 'prod',
    provider: 'gcp',
    instance: '',
    zone: 'europe-west1-b',
    project: '',
    auth: 'sa',
    keyRef: '',
    composePath: '/opt/app/docker-compose.prod.yml',
    interval: '30',
  });
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Load the user's organizations and default the form to the active one.
  useEffect(() => {
    if (!orgs.length) loadOrgs();
  }, [orgs.length, loadOrgs]);
  useEffect(() => {
    if (!form.organizationId && (activeOrgId || orgs[0])) {
      set('organizationId', activeOrgId ?? orgs[0].id);
    }
  }, [activeOrgId, orgs, form.organizationId]);

  // Switching provider resets the auth method to that provider's default.
  const setProvider = (provider: CloudProvider) =>
    setForm((f) => ({ ...f, provider, auth: PROVIDER_CONFIG[provider].auth[0][0] }));

  const providerConfig = PROVIDER_CONFIG[form.provider];
  const authOptions = providerConfig.auth;

  const submit = async () => {
    if (saving) return;
    if (!form.organizationId) {
      toast('Organizasyon seçin', { type: 'error' });
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await api.createApp({
        organizationId: form.organizationId,
        name: form.name,
        description: form.desc,
        env: form.env,
        vm: { instance: form.instance, zone: form.zone },
        provider: form.provider,
        project: form.project,
        authMethod: form.auth,
        composePath: form.composePath,
        collectInterval: Number(form.interval) || 30,
        credentialRef: form.keyRef.trim() || undefined,
      });
      await refresh();
      toast('Uygulama eklendi', { type: 'success', sub: form.name });
      navigate(paths.overview());
    } catch (e) {
      toast('Uygulama eklenemedi', { type: 'error', sub: (e as ApiError).message });
      setSaving(false);
    }
  };

  // No live cloud probe exists yet, so validate that the required connection
  // fields are filled and tell the user what still happens at agent setup.
  const testConnection = () => {
    const missing: string[] = [];
    if (!form.project.trim()) missing.push(providerConfig.projectLabel);
    if (!form.instance.trim()) missing.push('VM Instance');
    if (!form.zone.trim()) missing.push('Zone');
    if (form.auth === 'ssh' && !form.keyRef.trim()) missing.push('Özel anahtar yolu');
    if (missing.length) {
      toast('Eksik bilgi', { type: 'error', sub: missing.join(', ') });
      return;
    }
    toast('Bilgiler tamam', {
      type: 'success',
      sub: 'Canlı bağlantı, agent VM’de çalıştığında doğrulanır',
    });
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(provisionScript());
      toast('Script kopyalandı', { type: 'success', sub: 'Sunucuda sudo ile çalıştırın' });
    } catch {
      toast('Kopyalanamadı', { type: 'error', sub: 'Panelden manuel kopyalayın' });
    }
  };

  return (
    <div
      className="fade-up"
      style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <div>
        <Eyebrow>Yeni kaynak</Eyebrow>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>Uygulama ekle</h1>
        <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4 }}>
          LushOps bu VM’e SSH ile bağlanır,{' '}
          <span className="mono" style={{ color: 'var(--tx-1)' }}>
            docker stats
          </span>{' '}
          &amp;{' '}
          <span className="mono" style={{ color: 'var(--tx-1)' }}>
            compose ps
          </span>{' '}
          üzerinden container’ları periyodik olarak toplar.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div
              onClick={() => setStep(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <div
                className="mono"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12.5,
                  fontWeight: 700,
                  background: i <= step ? 'var(--acc)' : 'var(--panel)',
                  color: i <= step ? '#fff' : 'var(--tx-3)',
                  border: `1px solid ${i <= step ? 'transparent' : 'var(--line-2)'}`,
                }}
              >
                {i < step ? <Icon name="check" size={14} strokeW={2.6} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? 'var(--tx-0)' : 'var(--tx-3)' }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: i < step ? 'var(--acc)' : 'var(--line-2)',
                  margin: '0 14px',
                }}
              />
            )}
          </Fragment>
        ))}
      </div>

      <Card pad={24}>
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Field label="Organizasyon" hint="bu uygulama buraya bağlanır" span={2}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {orgs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => set('organizationId', o.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.organizationId === o.id ? 'var(--acc)' : 'var(--tx-2)',
                      background: form.organizationId === o.id ? 'var(--acc-soft)' : 'var(--bg-1)',
                      border: `1px solid ${form.organizationId === o.id ? 'var(--acc-line)' : 'var(--line-2)'}`,
                    }}
                  >
                    {o.name}
                  </button>
                ))}
                {!orgs.length && (
                  <span style={{ fontSize: 12.5, color: 'var(--tx-3)' }}>Organizasyon yükleniyor…</span>
                )}
              </div>
            </Field>
            <Field label="Uygulama adı" hint="benzersiz" span={2}>
              <TextInput value={form.name} onChange={(v) => set('name', v)} placeholder="payments-api" mono />
            </Field>
            <Field label="Açıklama" span={2}>
              <TextInput
                value={form.desc}
                onChange={(v) => set('desc', v)}
                placeholder="Ödeme orkestrasyon servisi"
              />
            </Field>
            <Field label="Ortam" span={2}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['prod', 'staging', 'dev'] as Environment[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => set('env', e)}
                    className="mono"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.env === e ? 'var(--acc)' : 'var(--tx-2)',
                      background: form.env === e ? 'var(--acc-soft)' : 'var(--bg-1)',
                      border: `1px solid ${form.env === e ? 'var(--acc-line)' : 'var(--line-2)'}`,
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Field label="Bulut sağlayıcı" span={2}>
              <div style={{ display: 'flex', gap: 8 }}>
                {PROVIDERS.map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setProvider(k)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.provider === k ? 'var(--acc)' : 'var(--tx-2)',
                      background: form.provider === k ? 'var(--acc-soft)' : 'var(--bg-1)',
                      border: `1px solid ${form.provider === k ? 'var(--acc-line)' : 'var(--line-2)'}`,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <div
              style={{
                gridColumn: 'span 2',
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-1)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--tx-2)',
                  marginBottom: 9,
                }}
              >
                <Icon name="doc" size={14} color="var(--acc)" />
                Bu bilgileri nereden alırım?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {providerConfig.help.map(([label, cmd]) => (
                  <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: 'var(--tx-1)', fontWeight: 600, minWidth: 130 }}>
                      {label}
                    </span>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--tx-2)' }}>
                      {cmd}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Field label={providerConfig.projectLabel} hint={providerConfig.hints.project} span={2}>
              <TextInput
                value={form.project}
                onChange={(v) => set('project', v)}
                placeholder={providerConfig.projectPlaceholder}
                mono
              />
            </Field>
            <Field label="VM Instance adı" hint={providerConfig.hints.instance}>
              <TextInput value={form.instance} onChange={(v) => set('instance', v)} placeholder="vm-pay-prod-1" mono />
            </Field>
            <Field label="Zone" hint={providerConfig.hints.zone}>
              <TextInput value={form.zone} onChange={(v) => set('zone', v)} placeholder="europe-west1-b" mono />
            </Field>
            <Field label="Kimlik doğrulama" span={2}>
              <div style={{ display: 'flex', gap: 8 }}>
                {authOptions.map(([k, l, ic]) => (
                  <button
                    key={k}
                    onClick={() => set('auth', k)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '12px 14px',
                      borderRadius: 9,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: form.auth === k ? 'var(--tx-0)' : 'var(--tx-2)',
                      background: form.auth === k ? 'var(--acc-soft)' : 'var(--bg-1)',
                      border: `1px solid ${form.auth === k ? 'var(--acc-line)' : 'var(--line-2)'}`,
                      textAlign: 'left',
                    }}
                  >
                    <Icon name={ic} size={16} color={form.auth === k ? 'var(--acc)' : 'var(--tx-3)'} />
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label={form.auth === 'ssh' ? 'Özel anahtar yolu' : 'Kimlik bilgisi referansı'}
              hint="opsiyonel"
              span={2}
            >
              <TextInput
                value={form.keyRef}
                onChange={(v) => set('keyRef', v)}
                placeholder={
                  form.auth === 'ssh' ? '~/.ssh/google_compute_engine' : 'kimlik bilgisi gizli anahtar referansı'
                }
                mono
              />
              {form.auth === 'ssh' && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 6, lineHeight: 1.5 }}>
                  ↳ {providerConfig.keyHelp}
                </div>
              )}
            </Field>

            <div
              style={{
                gridColumn: 'span 2',
                borderRadius: 10,
                background: 'var(--bg-1)',
                border: '1px solid var(--line)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon name="terminal" size={14} color="var(--acc)" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx-1)' }}>
                    Sunucu kurulum scripti
                  </span>
                </div>
                <Button variant="soft" icon="copy" size="sm" onClick={copyScript}>
                  Kopyala
                </Button>
              </div>
              <div style={{ padding: '8px 14px 4px', fontSize: 11.5, color: 'var(--tx-3)', lineHeight: 1.6 }}>
                Sunucuya bağlanıp <span className="mono" style={{ color: 'var(--tx-1)' }}>sudo bash</span> ile
                çalıştırın. Kullanıcı + Docker yetkisi + SSH anahtarı oluşturur ve sonunda yukarıdaki alanlara
                yapıştıracağınız bağlantı bloğunu (private key dahil) basar.
              </div>
              <pre
                className="mono"
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  fontSize: 11,
                  lineHeight: 1.55,
                  color: 'var(--tx-2)',
                  overflowX: 'auto',
                  maxHeight: 260,
                }}
              >
                {provisionScript()}
              </pre>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Field label="docker-compose dosya yolu" span={2}>
              <TextInput
                value={form.composePath}
                onChange={(v) => set('composePath', v)}
                placeholder="/opt/app/docker-compose.prod.yml"
                mono
                prefix="path"
              />
            </Field>
            <Field label="Toplama aralığı" hint="saniye">
              <TextInput value={form.interval} onChange={(v) => set('interval', v)} placeholder="30" mono />
            </Field>
            <Field label="Container keşfi">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 9,
                  padding: '9px 12px',
                }}
              >
                <Toggle on onClick={() => {}} />
                <span style={{ fontSize: 12.5, color: 'var(--tx-1)' }}>Tüm container’ları otomatik bul</span>
              </div>
            </Field>
            <div
              style={{
                gridColumn: 'span 2',
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-1)',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 8 }}>
                Varsayılan alarm kuralları (sonradan değiştirilebilir)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['status == exited', 'restarts > 5 / 10dk', 'cpu > 80% / 5dk', 'mem > 90%', 'healthcheck fail'].map(
                  (r) => (
                    <span
                      key={r}
                      className="mono"
                      style={{
                        fontSize: 11.5,
                        padding: '4px 9px',
                        borderRadius: 6,
                        background: 'var(--panel-hi)',
                        border: '1px solid var(--line-2)',
                        color: 'var(--tx-1)',
                      }}
                    >
                      {r}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="ghost" onClick={() => (step === 0 ? navigate(paths.overview()) : setStep(step - 1))}>
          {step === 0 ? 'İptal' : 'Geri'}
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step === 1 && (
            <Button variant="ghost" icon="refresh" onClick={testConnection}>
              Bağlantıyı test et
            </Button>
          )}
          {step < 2 ? (
            <Button variant="primary" icon="arrowRight" onClick={() => setStep(step + 1)}>
              Devam
            </Button>
          ) : (
            <Button variant="primary" icon="check" onClick={submit}>
              {saving ? 'Ekleniyor…' : 'Uygulamayı ekle'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
