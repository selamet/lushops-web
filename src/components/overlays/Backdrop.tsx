import type { ReactNode } from 'react';

interface BackdropProps {
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/** Centered modal scrim; mousedown on the backdrop closes, inner clicks don't. */
export function Backdrop({ onClose, children, width = 460 }: BackdropProps) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,12,0.66)',
        backdropFilter: 'blur(3px)',
        zIndex: 150,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '100%',
          animation: 'popIn .22s cubic-bezier(.2,.8,.3,1) both',
        }}
      >
        {children}
      </div>
    </div>
  );
}
