import { format, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Parseia yyyy-MM-dd no fuso local (evita UTC que desloca o dia em Brasília). */
export function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function toDateStr(date) {
  if (!date) return null;
  if (typeof date === 'string') return date.slice(0, 10);
  return format(date, 'yyyy-MM-dd');
}

export function formatDate(value) {
  const d = parseDateOnly(value);
  if (!d) return '';
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateLong(value) {
  const d = value instanceof Date ? value : parseDateOnly(value);
  if (!d) return '';
  return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function todayStr() {
  return toDateStr(startOfDay(new Date()));
}

export function isDateToday(value) {
  const d = parseDateOnly(value);
  return d ? isToday(d) : false;
}

export function daysUntil(value) {
  const due = parseDateOnly(value);
  if (!due) return null;
  const today = startOfDay(new Date());
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function getTaskDate(task) {
  if (task?._occurrenceDate) return task._occurrenceDate;
  const isEvent = task?.type === 'evento' || task?.type === 'compromisso';
  if (isEvent) {
    return task.event_date || (task.event_datetime ? String(task.event_datetime).split('T')[0] : null);
  }
  return task?.due_date || null;
}
