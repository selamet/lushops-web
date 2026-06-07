import { useEffect, useId, useMemo, useRef, useState } from 'react';

interface AreaChartProps {
  data: number[];
  color?: string;
  h?: number;
  max?: number;
}

/** Responsive filled area chart with horizontal grid and left axis labels. */
export function AreaChart({ data, color = 'var(--acc)', h = 180, max: fixedMax }: AreaChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const gid = useId();

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const padL = 38;
  const padB = 20;
  const padT = 12;

  const shape = useMemo(() => {
    if (!data || !data.length) return null;
    const max = fixedMax || Math.max(...data, 1) * 1.15;
    const iw = w - padL - 8;
    const ih = h - padB - padT;
    const pts = data.map((v, i) => [
      padL + (i / (data.length - 1)) * iw,
      padT + ih - (v / max) * ih,
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ` L ${padL + iw} ${padT + ih} L ${padL} ${padT + ih} Z`;
    return { d, area, max };
  }, [data, w, h, fixedMax]);

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      {shape && (
        <svg width={w} height={h}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.30" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => {
            const y = padT + (h - padB - padT) * (1 - t);
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={w - 8} y2={y} stroke="var(--line)" strokeWidth="1" />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--tx-3)"
                  fontFamily="var(--mono)"
                >
                  {Math.round(shape.max * t)}
                </text>
              </g>
            );
          })}
          <path d={shape.area} fill={`url(#${gid})`} />
          <path
            d={shape.d}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
