import { daysUntil, getTaskDate } from './dates';
import { isTaskDone } from './task-status';

const STORAGE_KEY = 'adm-baep-notif-sent';

function loadSent() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSent(set) {
  const today = new Date().toISOString().slice(0, 10);
  const kept = [...set].filter((k) => k.startsWith(today) || k.split('|')[0] === today);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kept.slice(-200)));
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkAndNotifyTasks(tasks) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const sent = loadSent();
  const today = new Date().toISOString().slice(0, 10);

  for (const task of tasks) {
    if (isTaskDone(task) || task.status === 'concluido') continue;
    if (task.remind_on_day === false && task.remind_day_before === false) continue;

    const dateStr = getTaskDate(task);
    const diff = daysUntil(dateStr);
    if (diff === null) continue;

    let kind = null;
    let body = null;
    if (diff < 0 && task.remind_on_day !== false) {
      kind = 'overdue';
      body = `Atrasada desde ${dateStr}`;
    } else if (diff === 0 && task.remind_on_day !== false) {
      kind = 'today';
      body = 'Vence hoje';
    } else if (diff === 1 && task.remind_day_before !== false) {
      kind = 'tomorrow';
      body = 'Vence amanhã';
    }
    if (!kind) continue;

    const key = `${today}|${task.id}|${dateStr}|${kind}`;
    if (sent.has(key)) continue;
    sent.add(key);

    try {
      new Notification(task.title || 'Tarefa', { body, tag: key });
    } catch {
      /* ignore */
    }
  }

  saveSent(sent);
}
