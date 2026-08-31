import React from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_LABELS } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { getDeadlineInfo } from '@/lib/deadline';
import { formatDateShort, getTaskDate } from '@/lib/dates';

const DEADLINE_ICONS = {
  overdue: AlertTriangle,
  today: Clock,
  tomorrow: Clock,
  week: Calendar,
  ok: Calendar,
};

const DEADLINE_TONE = {
  overdue: 'text-destructive',
  today: 'text-warning',
  tomorrow: 'text-warning',
  week: 'text-info',
  ok: 'text-muted-foreground',
};

export function DeadlineCard({ task, onClick }) {
  const info = getDeadlineInfo(task);
  const Icon = DEADLINE_ICONS[info.variant] || Calendar;
  const tone = DEADLINE_TONE[info.variant] || 'text-muted-foreground';
  const auxiliar = getAuxiliar(task);
  const dateStr = getTaskDate(task);
  const dateShort = dateStr ? formatDateShort(dateStr) : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className={cn(
        'w-full text-left bg-card rounded-xl border border-border/70 p-3.5',
        'transition-all active:scale-[0.99] hover:border-primary/20 focus-ring'
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {TYPE_LABELS[task.type] || task.type}
      </p>
      <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2 leading-snug">{task.title}</p>
      <div className={cn('flex items-center gap-1.5 mt-2 text-xs font-semibold', tone)}>
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {info.label}
          {dateShort && ` · ${dateShort}`}
        </span>
      </div>
      {auxiliar && (
        <p className="text-xs text-muted-foreground mt-1.5 truncate">{auxiliar}</p>
      )}
    </button>
  );
}

export function DueSoonEmpty() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5">
      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">Nenhum vencimento próximo</p>
        <p className="text-xs text-muted-foreground mt-0.5">Suas demandas estão dentro do prazo.</p>
      </div>
    </div>
  );
}
