import { describe, expect, it } from 'vitest';
import { getDeadlineInfo } from '../src/lib/deadline.js';
import { getBreakpoint } from '../src/hooks/useBreakpoint.js';

describe('getDeadlineInfo', () => {
  it('retorna concluído para tarefa finalizada', () => {
    const info = getDeadlineInfo({ status: 'concluido', due_date: '2020-01-01' });
    expect(info.variant).toBe('done');
    expect(info.label).toBe('Concluído');
  });

  it('retorna vencido para prazo passado', () => {
    const info = getDeadlineInfo({ status: 'pendente', due_date: '2020-01-01' });
    expect(info.variant).toBe('overdue');
    expect(info.label).toMatch(/Vencido há/);
  });

  it('retorna sem prazo quando não há data', () => {
    const info = getDeadlineInfo({ status: 'pendente' });
    expect(info.variant).toBe('none');
    expect(info.label).toMatch(/Sem prazo/);
  });
});

describe('getBreakpoint', () => {
  it('identifica compact em 390px', () => {
    expect(getBreakpoint(390)).toBe('compact');
  });

  it('identifica medium em 900px', () => {
    expect(getBreakpoint(900)).toBe('medium');
  });

  it('identifica expanded em 1440px', () => {
    expect(getBreakpoint(1440)).toBe('expanded');
  });
});
