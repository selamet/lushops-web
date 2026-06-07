import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, TextInput, Toggle } from '@/components/form';
import { Button, Card, Eyebrow, Icon, type IconName } from '@/components/ui';
import { paths } from '@/lib/routes';
import type { Environment } from '@/types';

interface FormState {
  name: string;
  desc: string;
  env: Environment;
  instance: string;
  zone: string;
  project: string;
  auth: 'sa' | 'ssh' | 'iap';
  composePath: string;
  interval: string;
}

const STEPS = ['Uygulama', 'VM bağlantısı', 'Docker & izleme'];

/** Three-step wizard to register a new monitored app. */
export function AddApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    name: '',
    desc: '',
    env: 'prod',
    instance: '',
    zone: 'europe-west1-b',
    project: '',
    auth: 'sa',
    composePath: '/opt/app/docker-compose.prod.yml',
    interval: '30',
  });
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const authOptions: Array<[FormState['auth'], string, IconName]> = [
    ['sa', 'Service Account', 'shield'],
    ['ssh', 'SSH anahtarı', 'terminal'],
    ['iap', 'IAP tünel', 'net'],
  ];

  return (
    <div
      className="fade-up"
      style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <div>
        <Eyebrow>Yeni kaynak</Eyebrow>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>Uygulama ekle</h1>
        <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4 }}>
          Sentinel bu VM’e SSH ile bağlanır,{' '}
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
            <Field label="GCP Projesi" span={2}>
              <TextInput
                value={form.project}
                onChange={(v) => set('project', v)}
                placeholder="my-gcp-project-prod"
                mono
              />
            </Field>
            <Field label="VM Instance adı">
              <TextInput value={form.instance} onChange={(v) => set('instance', v)} placeholder="vm-pay-prod-1" mono />
            </Field>
            <Field label="Zone">
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
            <Field label={form.auth === 'ssh' ? 'Özel anahtar yolu' : 'Service account JSON'} span={2}>
              <TextInput
                value=""
                onChange={() => {}}
                placeholder={
                  form.auth === 'ssh'
                    ? '~/.ssh/gcp_monitor'
                    : 'sentinel-monitor@project.iam.gserviceaccount.com'
                }
                mono
              />
            </Field>
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
            <Button variant="ghost" icon="refresh">
              Bağlantıyı test et
            </Button>
          )}
          {step < 2 ? (
            <Button variant="primary" icon="arrowRight" onClick={() => setStep(step + 1)}>
              Devam
            </Button>
          ) : (
            <Button variant="primary" icon="check" onClick={() => navigate(paths.overview())}>
              Uygulamayı ekle
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
