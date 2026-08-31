import React from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDeadlineInfo, DEADLINE_VARIANTS } from '@/lib/deadline';
import { Badge } from './badge';

const ICONS = {
  alert: AlertTriangle,
  clock: Clock,
  calendar: Calendar,
  check: CheckCircle2,
  none: Calendar,
};

export function DeadlineIndicator({ task, showDate = true, compact = false, className }) {
  const info = getDeadlineInfo(task);
  const cfg = DEADLINE_VARIANTS[info.variant] || DEADLINE_VARIANTS.none;
  const Icon = ICONS[cfg.icon] || Calendar;

  const badgeVariant =
    info.variant === 'overdue'
      ? 'destructive'
      : info.variant === 'done'
        ? 'success'
        : info.variant === 'today' || info.variant === 'tomorrow'
          ? 'warning'
          : info.variant === 'week'
            ? 'info'
            : 'default';

  if (compact) {
    return (
      <Badge variant={badgeVariant} className={className}>
        <Icon className="w-3 h-3" aria-hidden="true" />
        {info.shortLabel}
      </Badge>
    );
  }

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      <Badge variant={badgeVariant}>
        <Icon className="w-3 h-3" aria-hidden="true" />
        <span>{info.label}</span>
      </Badge>
      {showDate && info.absDate && info.variant !== 'done' && (
        <span className="text-[11px] text-muted-foreground pl-0.5">{info.absDate}</span>
      )}
    </div>
  );
}
