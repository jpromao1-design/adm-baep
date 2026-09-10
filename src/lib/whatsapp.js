import { TYPE_LABELS, STATUS_CONFIG } from './task-status';
import { formatDate, getTaskDate } from './dates';
import { getAuxiliar } from './sections';
import { getDeadlineInfo } from './deadline';

export function buildWhatsAppMessage(task) {
  if (!task) return '';
  const lines = [
    `*Adm BAEP* — ${TYPE_LABELS[task.type] || task.type}`,
    '',
    `*Título:* ${task.title || '—'}`,
  ];

  if (task.status) {
    lines.push(`*Status:* ${STATUS_CONFIG[task.status]?.label || task.status}`);
  }
  if (task.section) lines.push(`*Seção:* ${task.section}`);

  const dateStr = getTaskDate(task);
  if (dateStr) {
    const deadline = getDeadlineInfo(task);
    lines.push(`*Prazo:* ${formatDate(dateStr)}${deadline?.label ? ` (${deadline.label})` : ''}`);
  }
  if (task.event_time) lines.push(`*Horário:* ${task.event_time}`);
  if (task.location) lines.push(`*Local:* ${task.location}`);

  const auxiliar = getAuxiliar(task);
  if (auxiliar) lines.push(`*Auxiliar:* ${auxiliar}`);

  if (task.description) {
    const desc = String(task.description).trim().slice(0, 400);
    lines.push('', `*Descrição:* ${desc}`);
  }
  if (task.observations) {
    lines.push(`*Obs.:* ${String(task.observations).trim().slice(0, 200)}`);
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (origin && task.id) {
    lines.push('', `Registro: ${origin}${base}/tasks`);
  }

  return lines.join('\n');
}

export function openWhatsAppShare(task, phone = '') {
  const text = buildWhatsAppMessage(task);
  const digits = String(phone || '').replace(/\D/g, '');
  const url = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
