import { describe, expect, it } from 'vitest';
import { toTaskRow, isDomOrEvent } from '../src/api/tasks.js';
import { parseDateOnly, toDateStr } from '../src/lib/dates.js';
import { evaluatePassword } from '../src/lib/password.js';

describe('isDomOrEvent', () => {
  it('detecta objeto com preventDefault', () => {
    expect(isDomOrEvent({ preventDefault: () => {} })).toBe(true);
  });

  it('aceita objeto plano', () => {
    expect(isDomOrEvent({ title: 'Teste' })).toBe(false);
  });
});

describe('toTaskRow', () => {
  it('converte payload plano', () => {
    const row = toTaskRow({
      title: '  Reunião  ',
      type: 'evento',
      status: 'pendente',
      section: 'P1',
      event_date: '2026-09-01',
      auxiliar: 'Souza',
    });
    expect(row.title).toBe('Reunião');
    expect(row.type).toBe('evento');
    expect(row.section).toBe('P1');
    expect(row.event_date).toBe('2026-09-01');
    expect(row.auxiliar).toBe('Souza');
  });

  it('rejeita evento sintético', () => {
    expect(() => toTaskRow({ preventDefault: () => {}, title: 'x' })).toThrow(/inválidos/);
  });

  it('exige título', () => {
    expect(() => toTaskRow({ type: 'tarefa' })).toThrow(/obrigatório/);
  });
});

describe('parseDateOnly', () => {
  it('parseia yyyy-MM-dd no fuso local', () => {
    const d = parseDateOnly('2026-08-21');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(21);
  });

  it('formata de volta sem deslocar dia', () => {
    expect(toDateStr(parseDateOnly('2026-08-21'))).toBe('2026-08-21');
  });
});

describe('evaluatePassword', () => {
  it('rejeita senha fraca', () => {
    const r = evaluatePassword('123');
    expect(r.valid).toBe(false);
  });

  it('aceita senha forte', () => {
    const r = evaluatePassword('SenhaSegura9');
    expect(r.valid).toBe(true);
  });
});
