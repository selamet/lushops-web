import { Icon, type IconName } from '@/components/ui';
import { useOverlay, type ToastType } from '@/store/overlay';
import { ConfirmModal } from './ConfirmModal';
import { TerminalModal } from './TerminalModal';

const TOAST_COLOR: Record<ToastType, string> = {
  info: 'var(--acc)',
  success: 'var(--ok)',
  warn: 'var(--warn)',
  error: 'var(--crit)',
};

const TOAST_ICON: Record<ToastType, IconName> = {
  info: 'bell',
  success: 'check',
  warn: 'alert',
  error: 'alert',
};

/** Renders the toast stack, confirm modal and terminal driven by the overlay store. */
export function OverlayHost() {
  const { toasts, modal, terminal } = useOverlay();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 22,
          right: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 200,
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 11,
              padding: '13px 16px',
              minWidth: 280,
              maxWidth: 380,
              background: 'var(--elev)',
              border: '1px solid var(--line-3)',
              borderLeft: `3px solid ${TOAST_COLOR[t.type]}`,
              borderRadius: 11,
              boxShadow: 'var(--shadow-pop)',
              animation: 'toastIn .28s cubic-bezier(.2,.8,.3,1) both',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                display: 'grid',
                placeItems: 'center',
                background: `${TOAST_COLOR[t.type]}1f`,
                color: TOAST_COLOR[t.type],
                flexShrink: 0,
              }}
            >
              <Icon name={TOAST_ICON[t.type]} size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-0)' }}>{t.msg}</div>
              {t.sub && (
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--tx-2)', marginTop: 2 }}>
                  {t.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && <ConfirmModal cfg={modal} />}
      {terminal && <TerminalModal container={terminal} />}
    </>
  );
}
