import React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, getEffectiveStatus } from '@/lib/task-status';

export function StatusBadge({ task, className }) {
  const key = getEffectiveStatus(task);
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.pendente;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}
