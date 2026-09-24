import { TYPE_LABELS, STATUS_CONFIG } from './task-status';
import { formatDate, getTaskDate } from './dates';
import { getAuxiliar } from './sections';

const TYPE_EMOJI = {
  demanda: '📌',
  tarefa: '📋',
  evento: '📅',
  compromisso: '📅',
};

/** Caminho público do brasão oficial do 8º BAEP (vai junto no compartilhamento). */
export const BRASAO_8BAEP_PATH = 'brasao-8baep.png';

function typeHeader(type) {
  const label = (TYPE_LABELS[type] || type || 'Tarefa').toUpperCase();
  const emoji = TYPE_EMOJI[type] || '📋';
  return `${emoji} *${label} — 8º BAEP*`;
}

function observationText(task) {
  const parts = [task.description, task.observations, task.notes]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  if (!unique.length) return '';
  return unique.join('\n').slice(0, 500);
}

function brasaoPublicUrl() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}${BRASAO_8BAEP_PATH}`;
}

/** Mensagem institucional para compartilhar tarefa/demanda no WhatsApp (sem URL do sistema). */
export function buildWhatsAppMessage(task) {
  if (!task) return '';

  const lines = [typeHeader(task.type), ''];

  const title = String(task.title || '').trim();
  if (title) {
    lines.push(`*${title}*`);
    lines.push('');
  }

  const dateStr = getTaskDate(task);
  if (dateStr) {
    const formatted = formatDate(dateStr);
    if (formatted) lines.push(`📅 *Prazo:* ${formatted}`);
  }

  if (task.status) {
    const statusLabel = STATUS_CONFIG[task.status]?.label || task.status;
    lines.push(`⏳ *Status:* ${statusLabel}`);
  }

  if (task.priority) {
    lines.push(`🎯 *Prioridade:* ${String(task.priority).trim()}`);
  }

  const responsavel = getAuxiliar(task);
  if (responsavel) lines.push(`👤 *Responsável:* ${responsavel}`);

  if (task.section) {
    lines.push(`🏢 *Seção:* ${String(task.section).trim()}`);
  }

  if (task.event_time) {
    lines.push(`🕒 *Horário:* ${String(task.event_time).trim()}`);
  }

  if (task.location) {
    lines.push(`📍 *Local:* ${String(task.location).trim()}`);
  }

  const observation = observationText(task);
  if (observation) {
    lines.push('', '📝 *Observação:*', observation);
  }

  // Rodapé institucional — sem emoji de escudo genérico (brasão oficial vai como imagem no share).
  lines.push('', '──────────────────', '*8º BAEP*');

  return lines.join('\n');
}

/** Alias compatível com a API pedida na especificação. */
export const formatTaskWhatsAppMessage = buildWhatsAppMessage;

export function buildWhatsAppShareUrl(task, phone = '') {
  const text = buildWhatsAppMessage(task);
  const digits = String(phone || '').replace(/\D/g, '');
  return digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function tryShareWithBrasao(text) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (typeof navigator.share !== 'function') return false;

  const response = await fetch(brasaoPublicUrl());
  if (!response.ok) return false;

  const blob = await response.blob();
  const file = new File([blob], BRASAO_8BAEP_PATH, { type: blob.type || 'image/png' });

  if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
    return false;
  }

  const payload = { files: [file], text, title: '8º BAEP' };
  if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
    return false;
  }

  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return true;
    return false;
  }
}

export async function openWhatsAppShare(task, phone = '') {
  const text = buildWhatsAppMessage(task);

  // No celular, tenta enviar o brasão oficial junto com o texto (Web Share API).
  try {
    if (await tryShareWithBrasao(text)) return;
  } catch {
    /* fallback wa.me */
  }

  const url = buildWhatsAppShareUrl(task, phone);
  window.open(url, '_blank', 'noopener,noreferrer');
}
