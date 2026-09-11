import React from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_LABELS } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { getDeadlineInfo } from '@/lib/deadline';
import { formatDateShort, getTaskDate } from '@/lib/dates';
import { TaskCardActions } from '@/components/tasks/TaskCardActions';
import { useAuth } from '@/lib/AuthContext';

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

export function DeadlineCard({
  task,
  onClick,
  onStatusChange,
  onEdit,
  showQuickStatus = true,
  statusBusy = false,
}) {
  const { can } = useAuth();
  const info = getDeadlineInfo(task);
  const Icon = DEADLINE_ICONS[info.variant] || Calendar;
  const tone = DEADLINE_TONE[info.variant] || 'text-muted-foreground';
  const auxiliar = getAuxiliar(task);
  const dateStr = getTaskDate(task);
  const dateShort = dateStr ? formatDateShort(dateStr) : null;
  const canEdit = Boolean(onEdit) && can('manageTasks');
  const canChangeStatus = Boolean(onStatusChange) && can('changeAnyStatus');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(task);
        }
      }}
      className={cn(
        'w-full text-left bg-card rounded-xl border border-border/50 p-3.5 cursor-pointer',
        'transition-all active:scale-[0.99] hover:border-border focus-ring'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {TYPE_LABELS[task.type] || task.type}
        </p>
        <TaskCardActions
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          showQuickStatus={showQuickStatus}
          canChangeStatus={canChangeStatus}
          canEdit={canEdit}
          statusBusy={statusBusy}
          className="scale-95 origin-top-right"
        />
      </div>
      <p className="text-sm font-semibold text-foreground mt-1 line-clamp-2 leading-snug">{task.title}</p>
      <div className={cn('flex items-center gap-1.5 mt-2.5 text-xs font-semibold', tone)}>
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {info.label}
          {dateShort && ` · ${dateShort}`}
        </span>
      </div>
      {auxiliar && <p className="text-xs text-muted-foreground mt-1.5 truncate">{auxiliar}</p>}
    </div>
  );
}

export function DueSoonEmpty() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3.5">
      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">Nenhum vencimento próximo</p>
        <p className="text-xs text-muted-foreground mt-0.5">Suas demandas estão dentro do prazo.</p>
      </div>
    </div>
  );
}
