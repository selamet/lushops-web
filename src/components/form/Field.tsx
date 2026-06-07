import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: number;
}

/** Labeled form field that can span multiple grid columns. */
export function Field({ label, hint, children, span }: FieldProps) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx-1)' }}>{label}</label>
        {hint && <span style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
