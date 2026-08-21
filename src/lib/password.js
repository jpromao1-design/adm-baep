export const DEFAULT_INITIAL_PASSWORD = '123mudar';

export function isDefaultInitialPassword(password) {
  return String(password || '') === DEFAULT_INITIAL_PASSWORD;
}

export function evaluatePassword(password, { currentPassword } = {}) {
  const value = String(password || '');
  const issues = [];

  if (value.length < 8) issues.push('Use pelo menos 8 caracteres.');
  if (!/[A-Za-zÀ-ÿ]/.test(value)) issues.push('Inclua pelo menos uma letra.');
  if (!/\d/.test(value)) issues.push('Inclua pelo menos um número.');
  if (isDefaultInitialPassword(value)) issues.push('Não use a senha padrão inicial.');
  if (currentPassword && value === currentPassword) issues.push('A nova senha deve ser diferente da atual.');

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Za-zÀ-ÿ]/.test(value) && /\d/.test(value)) score += 1;
  if (/[^A-Za-zÀ-ÿ0-9]/.test(value)) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;

  let label = 'Fraca';
  let tone = 'bg-rose-500';
  if (issues.length === 0 && score >= 4) {
    label = 'Forte';
    tone = 'bg-emerald-500';
  } else if (issues.length === 0) {
    label = 'Média';
    tone = 'bg-amber-500';
  }

  return {
    valid: issues.length === 0,
    issues,
    score: Math.min(score, 4),
    label,
    tone,
  };
}
