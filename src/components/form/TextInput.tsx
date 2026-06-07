import { useState } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  prefix?: string;
}

/** Text input with focus ring and optional monospace styling / prefix. */
export function TextInput({ value, onChange, placeholder, mono, prefix }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-1)',
        border: `1px solid ${focused ? 'var(--acc-line)' : 'var(--line-2)'}`,
        borderRadius: 9,
        padding: '10px 12px',
        transition: 'border-color .15s',
        boxShadow: focused ? '0 0 0 3px var(--acc-soft)' : 'none',
      }}
    >
      {prefix && (
        <span className="mono" style={{ color: 'var(--tx-3)', fontSize: 12.5 }}>
          {prefix}
        </span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={mono ? 'mono' : ''}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--tx-0)',
          fontSize: 13.5,
          minWidth: 0,
        }}
      />
    </div>
  );
}
