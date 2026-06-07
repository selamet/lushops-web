import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { useOverlay } from '@/store/overlay';
import type { Container } from '@/types';
import { Backdrop } from './Backdrop';

interface Line {
  t: 'cmd' | 'out';
  v: string;
}

// Canned responses for the mock exec shell.
const TERM_RESPONSES: Record<string, string> = {
  ls: 'app  requirements.txt  manage.py  static  logs  Dockerfile',
  'ls -la':
    'drwxr-xr-x  8 root root  4096 Jun  6 09:12 .\ndrwxr-xr-x  1 root root  4096 Jun  6 08:01 ..\n-rw-r--r--  1 root root   812 Jun  6 08:00 Dockerfile\n-rwxr-xr-x  1 root root  1024 Jun  6 08:00 manage.py',
  'ps aux':
    'USER  PID  %CPU  %MEM  COMMAND\nroot    1  41.2  6.1  python -m uvicorn app:api\nroot   24   0.3  0.4  /bin/sh',
  env: 'TZ=Europe/Istanbul\nLOG_LEVEL=info\nPYTHONUNBUFFERED=1\nDATABASE_URL=postgres://***@postgres:5432/app',
  'df -h': 'Filesystem  Size  Used Avail Use%\noverlay      30G   18G   12G  60%  /',
  'free -m': '              total  used  free\nMem:           1024   612   412',
  whoami: 'root',
  pwd: '/opt/app',
  uptime: ' 09:14:22 up 6 days,  4:02,  load average: 0.84, 0.91, 0.77',
  help: 'Demo kabuk. Deneyin: ls, ps aux, env, df -h, free -m, uptime, clear, exit',
};

interface TerminalModalProps {
  container: Container;
}

/** Mock interactive `exec /bin/sh` session against a container. */
export function TerminalModal({ container }: TerminalModalProps) {
  const openTerminal = useOverlay((s) => s.openTerminal);
  const [lines, setLines] = useState<Line[]>([
    { t: 'out', v: `Connected to ${container.name} (${container.image}:${container.tag})` },
    { t: 'out', v: `Type 'help' for demo commands. 'exit' to close.` },
  ]);
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const run = (cmd: string) => {
    const c = cmd.trim();
    if (!c) {
      setLines((l) => [...l, { t: 'cmd', v: '' }]);
      return;
    }
    if (c === 'exit') {
      openTerminal(null);
      return;
    }
    if (c === 'clear') {
      setLines([]);
      return;
    }
    let out = TERM_RESPONSES[c];
    if (c === 'cat /etc/hostname') out = container.name;
    if (out === undefined) out = `sh: ${c.split(' ')[0]}: not found`;
    setLines((l) => [...l, { t: 'cmd', v: c }, ...(out ? [{ t: 'out' as const, v: out }] : [])]);
  };

  return (
    <Backdrop onClose={() => openTerminal(null)} width={720}>
      <div
        style={{
          background: 'var(--bg-0)',
          border: '1px solid var(--line-3)',
          borderRadius: 13,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 15px',
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', gap: 7 }}>
            {['#f5556d', '#fbbf24', '#34d399'].map((c) => (
              <span
                key={c}
                style={{ width: 11, height: 11, borderRadius: '50%', background: c }}
              />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--tx-1)', marginLeft: 6 }}>
            root@{container.name}: /opt/app — exec /bin/sh
          </span>
          <button
            onClick={() => openTerminal(null)}
            style={{ marginLeft: 'auto', color: 'var(--tx-3)' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="mono"
          style={{
            height: 360,
            overflow: 'auto',
            padding: '13px 15px',
            fontSize: 13,
            lineHeight: 1.7,
            cursor: 'text',
          }}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                whiteSpace: 'pre-wrap',
                color: l.t === 'cmd' ? 'var(--tx-0)' : 'var(--tx-2)',
              }}
            >
              {l.t === 'cmd' && <span style={{ color: 'var(--ok)' }}>$ </span>}
              {l.v}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--ok)', marginRight: 6 }}>$</span>
            <input
              ref={inputRef}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  run(val);
                  setVal('');
                }
              }}
              spellCheck={false}
              autoComplete="off"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--tx-0)',
                fontFamily: 'var(--mono)',
                fontSize: 13,
              }}
            />
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
