import { Button, Icon } from '@/components/ui';
import { useOverlay, type ConfirmConfig } from '@/store/overlay';
import { Backdrop } from './Backdrop';

interface ConfirmModalProps {
  cfg: ConfirmConfig;
}

/** Confirmation dialog with an optional command preview. */
export function ConfirmModal({ cfg }: ConfirmModalProps) {
  const closeModal = useOverlay((s) => s.closeModal);
  const danger = cfg.danger;

  return (
    <Backdrop onClose={closeModal}>
      <div
        style={{
          background: 'var(--elev)',
          border: '1px solid var(--line-3)',
          borderRadius: 15,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                background: danger ? 'var(--crit-soft)' : 'var(--acc-soft)',
                color: danger ? 'var(--crit)' : 'var(--acc)',
              }}
            >
              <Icon name={cfg.icon || (danger ? 'alert' : 'restart')} size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{cfg.title}</div>
              {cfg.desc && (
                <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 4, lineHeight: 1.5 }}>
                  {cfg.desc}
                </div>
              )}
            </div>
          </div>
          {cfg.cmd && (
            <div
              className="mono"
              style={{
                marginTop: 15,
                padding: '11px 13px',
                borderRadius: 9,
                background: 'var(--bg-0)',
                border: '1px solid var(--line-2)',
                fontSize: 12.5,
                color: 'var(--ok)',
              }}
            >
              <span style={{ color: 'var(--tx-3)' }}>$ </span>
              {cfg.cmd}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 9,
            padding: '14px 22px',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg-1)',
          }}
        >
          <Button variant="ghost" onClick={closeModal}>
            İptal
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            icon={cfg.confirmIcon}
            onClick={() => {
              closeModal();
              cfg.onConfirm?.();
            }}
          >
            {cfg.confirmLabel || 'Onayla'}
          </Button>
        </div>
      </div>
    </Backdrop>
  );
}
