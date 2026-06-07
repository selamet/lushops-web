interface ToggleProps {
  on: boolean;
  onClick: () => void;
}

/** Sliding on/off switch. */
export function Toggle({ on, onClick }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        padding: 2,
        background: on ? 'var(--acc)' : 'var(--line-3)',
        transition: 'background .2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          width: 19,
          height: 19,
          borderRadius: '50%',
          background: '#fff',
          transform: on ? 'translateX(17px)' : 'translateX(0)',
          transition: 'transform .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
        }}
      />
    </button>
  );
}
