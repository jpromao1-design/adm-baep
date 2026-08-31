import { formatDate, daysUntil, getTaskDate } from './dates';
import { isTaskDone } from './task-status';

export const DEADLINE_VARIANTS = {
  done: {
    label: 'Concluído',
    className: 'bg-success/10 text-success border-success/20',
    icon: 'check',
  },
  overdue: {
    label: 'Vencido',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: 'alert',
  },
  today: {
    label: 'Vence hoje',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: 'clock',
  },
  tomorrow: {
    label: 'Vence amanhã',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: 'clock',
  },
  week: {
    label: 'Vence nesta semana',
    className: 'bg-info/10 text-info border-info/20',
    icon: 'calendar',
  },
  ok: {
    label: 'Dentro do prazo',
    className: 'bg-muted text-muted-foreground border-border',
    icon: 'calendar',
  },
  none: {
    label: 'Sem prazo',
    className: 'bg-muted text-muted-foreground border-border',
    icon: 'none',
  },
};

export function getDeadlineInfo(task) {
  if (isTaskDone(task)) {
    return {
      variant: 'done',
      label: 'Concluído',
      shortLabel: 'Concluído',
      absDate: null,
      days: null,
    };
  }

  const dateStr = getTaskDate(task);
  if (!dateStr) {
    return {
      variant: 'none',
      label: 'Sem prazo definido',
      shortLabel: 'Sem prazo',
      absDate: null,
      days: null,
    };
  }

  const diff = daysUntil(dateStr);
  const absDate = formatDate(dateStr);

  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      variant: 'overdue',
      label: days === 1 ? 'Vencido há 1 dia' : `Vencido há ${days} dias`,
      shortLabel: 'Vencido',
      absDate,
      days: diff,
    };
  }

  if (diff === 0) {
    return { variant: 'today', label: 'Vence hoje', shortLabel: 'Hoje', absDate, days: 0 };
  }

  if (diff === 1) {
    return { variant: 'tomorrow', label: 'Vence amanhã', shortLabel: 'Amanhã', absDate, days: 1 };
  }

  if (diff <= 7) {
    return {
      variant: 'week',
      label: `Vence em ${diff} dias`,
      shortLabel: `${diff} dias`,
      absDate,
      days: diff,
    };
  }

  return {
    variant: 'ok',
    label: `Vence em ${diff} dias`,
    shortLabel: absDate,
    absDate,
    days: diff,
  };
}
