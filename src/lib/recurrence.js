import { addDays, addMonths, addYears, startOfDay } from 'date-fns';
import { parseDateOnly, toDateStr } from './dates';

export const RECURRENCE_LABELS = {
  diaria: 'Diária',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
};

export function addRecurrence(date, recurrence) {
  switch (recurrence) {
    case 'diaria':
      return addDays(date, 1);
    case 'semanal':
      return addDays(date, 7);
    case 'quinzenal':
      return addDays(date, 14);
    case 'mensal':
      return addMonths(date, 1);
    case 'semestral':
      return addMonths(date, 6);
    case 'anual':
      return addYears(date, 1);
    default:
      return date;
  }
}

export function isOccurrenceCompleted(task, dateStr) {
  if (!dateStr) return false;
  return Array.isArray(task.completed_occurrences) && task.completed_occurrences.includes(dateStr);
}

/**
 * Expande séries recorrentes em ocorrências no intervalo [rangeStart, rangeEnd].
 * Tarefas não recorrentes são devolvidas como estão.
 */
export function expandRecurringTasks(tasks, rangeStart, rangeEnd) {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  const out = [];

  for (const task of tasks) {
    if (!task.is_recurring || !task.recurrence) {
      out.push(task);
      continue;
    }

    const seed = parseDateOnly(task.start_date || task.due_date || task.event_date || task.created_at);
    if (!seed) {
      out.push(task);
      continue;
    }

    const seriesEnd = task.recurrence_end_date ? parseDateOnly(task.recurrence_end_date) : end;
    let cursor = seed;
    let guard = 0;

    while (cursor < start && cursor <= seriesEnd && guard < 2500) {
      cursor = addRecurrence(cursor, task.recurrence);
      guard += 1;
    }

    while (cursor <= end && cursor <= seriesEnd && guard < 2500) {
      const dateStr = toDateStr(cursor);
      const isEvent = task.type === 'evento' || task.type === 'compromisso';
      out.push({
        ...task,
        _occurrenceDate: dateStr,
        due_date: isEvent ? task.due_date : dateStr,
        event_date: isEvent ? dateStr : task.event_date,
      });
      cursor = addRecurrence(cursor, task.recurrence);
      guard += 1;
    }
  }

  return out;
}
