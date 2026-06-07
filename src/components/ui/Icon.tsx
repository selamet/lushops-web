import type { CSSProperties } from 'react';

// Minimal stroke glyphs (Lucide-compatible paths). Each value is a single `d`
// string; multiple sub-paths are separated by a leading " M" and split apart
// at render time.
export const ICONS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  layers: 'M12 2 2 7l10 5 10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H4a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 5.2 8.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H20a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.1z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  cpu: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M5 5h14v14H5z M9 9h6v6H9z',
  mem: 'M3 8h18v8H3z M7 8v8M11 8v8M15 8v8M5 5v3M9 5v3M13 5v3M17 5v3',
  net: 'M5 12.5a9 9 0 0 1 14 0M8 16a5 5 0 0 1 8 0M12 19.5h.01M2 9a14 14 0 0 1 20 0',
  disk: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 12h.01M12 2v4M12 18v4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevR: 'M9 6l6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  restart: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5z',
  pause: 'M10 4H6v16h4zM18 4h-4v16h4z',
  play: 'M6 4l14 8-14 8z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  copy: 'M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  server:
    'M5 3h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 14h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zM7 6h.01M7 17h.01',
  slack:
    'M9 12a2 2 0 1 1-2-2h2zM9 12v6a2 2 0 1 1-2-2M12 9a2 2 0 1 1 2-2v2zM12 9H6a2 2 0 1 1 2-2M15 12a2 2 0 1 1 2 2h-2zM15 12V6a2 2 0 1 1 2 2M12 15a2 2 0 1 1-2 2v-2zM12 15h6a2 2 0 1 1-2 2',
  refresh: 'M21 2v6h-6M3 22v-6h6M21 8a9 9 0 0 0-15-3L3 8M3 16a9 9 0 0 0 15 3l3-3',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeW?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, color = 'currentColor', strokeW = 1.8, style }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeW}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i ? 'M' : '') + seg} />
      ))}
    </svg>
  );
}
