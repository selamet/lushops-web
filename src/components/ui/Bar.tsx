interface BarProps {
  value: number;
  color?: string;
  warn?: number;
  crit?: number;
  h?: number;
}

/** Thin progress bar that turns amber/red as the value crosses thresholds. */
export function Bar({ value, color = 'var(--acc)', warn = 80, crit = 92, h = 6 }: BarProps) {
  let c = color;
  if (value >= crit) c = 'var(--crit)';
  else if (value >= warn) c = 'var(--warn)';
  return (
    <div
      style={{
        width: '100%',
        height: h,
        borderRadius: 999,
        background: 'var(--line-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: Math.min(value, 100) + '%',
          height: '100%',
          borderRadius: 999,
          background: c,
          transition: 'width .5s, background .3s',
        }}
      />
    </div>
  );
}
