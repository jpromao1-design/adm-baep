import { startOfDay } from 'date-fns';
import { daysUntil, getTaskDate, parseDateOnly } from './dates';
import { isOccurrenceCompleted } from './recurrence';

export const STATUS_CONFIG = {
  pendente: { label: 'Pendente', className: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em andamento', className: 'bg-sky-100 text-sky-700' },
  aguardando: { label: 'Aguardando', className: 'bg-violet-100 text-violet-700' },
  concluido: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-700' },
  atrasado: { label: 'Atrasada', className: 'bg-rose-100 text-rose-700' },
};

/** Status persistidos no banco (CHECK). `atrasado` é só exibição calculada. */
export const TASK_STATUS_VALUES = ['pendente', 'em_andamento', 'aguardando', 'concluido'];

export const TYPE_LABELS = {
  tarefa: 'Tarefa',
  demanda: 'Demanda',
  evento: 'Evento',
  compromisso: 'Compromisso',
};

export function editAriaLabel(task) {
  if (task?.type === 'demanda') return 'Editar demanda';
  if (task?.type === 'evento') return 'Editar evento';
  if (task?.type === 'compromisso') return 'Editar compromisso';
  return 'Editar tarefa';
}

export function isTaskDone(task) {
  if (task.is_recurring && task._occurrenceDate) {
    return isOccurrenceCompleted(task, task._occurrenceDate);
  }
  return task.status === 'concluido';
}

export function isOverdue(task) {
  if (isTaskDone(task)) return false;
  const dateStr = getTaskDate(task);
  const due = parseDateOnly(dateStr);
  if (!due) return false;
  return due < startOfDay(new Date());
}

export function isDueToday(task) {
  if (isTaskDone(task)) return false;
  return daysUntil(getTaskDate(task)) === 0;
}

export function isDueSoon(task) {
  if (isTaskDone(task)) return false;
  const diff = daysUntil(getTaskDate(task));
  return diff !== null && diff > 0 && diff <= 4;
}

export function getEffectiveStatus(task) {
  if (isTaskDone(task)) return 'concluido';
  if (isOverdue(task)) return 'atrasado';
  return task.status || 'pendente';
}
