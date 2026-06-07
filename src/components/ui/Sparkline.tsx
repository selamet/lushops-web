import { useId, useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
  strokeW?: number;
}

/** Compact inline trend line with optional gradient fill. */
export function Sparkline({
  data,
  color = 'var(--acc)',
  w = 120,
  h = 32,
  fill = true,
  strokeW = 1.6,
}: SparklineProps) {
  const gid = useId();
  const shape = useMemo(() => {
    if (!data || !data.length) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const rng = max - min || 1;
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * w,
      h - 4 - ((v - min) / rng) * (h - 8),
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ` L ${w} ${h} L 0 ${h} Z`;
    const last = pts[pts.length - 1];
    return { d, area, lastX: last[0], lastY: last[1] };
  }, [data, w, h]);

  if (!shape) return null;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={shape.area} fill={`url(#${gid})`} />}
      <path
        d={shape.d}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={shape.lastX} cy={shape.lastY} r="2.4" fill={color} />
    </svg>
  );
}
