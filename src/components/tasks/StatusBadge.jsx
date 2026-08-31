import React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, getEffectiveStatus } from '@/lib/task-status';
import { Badge } from '@/components/ui/badge';

const VARIANT_MAP = {
  pendente: 'default',
  em_andamento: 'info',
  aguardando: 'primary',
  concluido: 'success',
  atrasado: 'destructive',
};

export function StatusBadge({ task, className }) {
  const key = getEffectiveStatus(task);
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.pendente;
  return (
    <Badge variant={VARIANT_MAP[key] || 'default'} className={cn('shrink-0', className)}>
      {cfg.label}
    </Badge>
  );
}
