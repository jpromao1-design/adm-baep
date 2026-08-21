export const SECTIONS = ['P1', 'P3', 'P5'];

export function isValidSection(value) {
  if (!value) return true;
  return SECTIONS.includes(String(value).trim().toUpperCase());
}

export function normalizeSection(value) {
  if (!value) return null;
  const v = String(value).trim().toUpperCase();
  return SECTIONS.includes(v) ? v : null;
}

export function getAuxiliar(task) {
  if (!task) return '';
  return (task.auxiliar || task.involved || '').trim();
}
