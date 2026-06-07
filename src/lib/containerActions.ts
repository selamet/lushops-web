import { useOverlay } from '@/store/overlay';
import type { IconName } from '@/components/ui';
import type { Container } from '@/types';
import type { ToastType } from '@/store/overlay';

type ActionKind = 'restart' | 'stop' | 'start';

interface ActionConfig {
  title: string;
  desc: string;
  cmd: string;
  confirmLabel: string;
  confirmIcon: IconName;
  icon: IconName;
  danger?: boolean;
  toast: string;
  type: ToastType;
}

/** Open a confirm modal for a lifecycle action and toast the result on confirm. */
export function containerAction(c: Container, action: ActionKind): void {
  const configs: Record<ActionKind, ActionConfig> = {
    restart: {
      title: `${c.name} yeniden başlatılsın mı?`,
      desc: 'Container durdurulup yeniden başlatılacak. Kısa kesinti olabilir.',
      cmd: `docker restart ${c.name}`,
      confirmLabel: 'Yeniden başlat',
      confirmIcon: 'restart',
      icon: 'restart',
      toast: 'Yeniden başlatıldı',
      type: 'success',
    },
    stop: {
      title: `${c.name} durdurulsun mu?`,
      desc: 'Container durdurulacak. Trafik bu servise ulaşamayacak.',
      cmd: `docker stop ${c.name}`,
      confirmLabel: 'Durdur',
      confirmIcon: 'pause',
      icon: 'pause',
      danger: true,
      toast: 'Durduruldu',
      type: 'warn',
    },
    start: {
      title: `${c.name} başlatılsın mı?`,
      desc: 'Container başlatılacak.',
      cmd: `docker start ${c.name}`,
      confirmLabel: 'Başlat',
      confirmIcon: 'play',
      icon: 'play',
      toast: 'Başlatıldı',
      type: 'success',
    },
  };
  const cfg = configs[action];
  const { confirmAction, toast } = useOverlay.getState();
  confirmAction({
    title: cfg.title,
    desc: cfg.desc,
    cmd: cfg.cmd,
    confirmLabel: cfg.confirmLabel,
    confirmIcon: cfg.confirmIcon,
    icon: cfg.icon,
    danger: cfg.danger,
    onConfirm: () => toast(`${c.name} · ${cfg.toast}`, { type: cfg.type, sub: cfg.cmd }),
  });
}
