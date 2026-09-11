import { describe, expect, it } from 'vitest';
import { STATUS_CONFIG, TASK_STATUS_VALUES, editAriaLabel } from '../src/lib/task-status.js';
import { can } from '../src/lib/permissions.js';

describe('dashboard card status options', () => {
  it('expõe apenas status persistidos no banco', () => {
    expect(TASK_STATUS_VALUES).toEqual(['pendente', 'em_andamento', 'aguardando', 'concluido']);
    expect(TASK_STATUS_VALUES).not.toContain('atrasado');
  });

  it('tem rótulos em português para cada status editável', () => {
    for (const key of TASK_STATUS_VALUES) {
      expect(STATUS_CONFIG[key]?.label).toBeTruthy();
    }
    expect(STATUS_CONFIG.pendente.label).toBe('Pendente');
    expect(STATUS_CONFIG.em_andamento.label).toBe('Em andamento');
    expect(STATUS_CONFIG.aguardando.label).toBe('Aguardando');
    expect(STATUS_CONFIG.concluido.label).toBe('Concluída');
  });
});

describe('dashboard card permissions', () => {
  it('admin e auxiliar podem editar e alterar status', () => {
    const admin = { role: 'admin', active: true };
    const auxiliar = { role: 'auxiliar', active: true };
    expect(can(admin, 'manageTasks')).toBe(true);
    expect(can(admin, 'changeAnyStatus')).toBe(true);
    expect(can(auxiliar, 'manageTasks')).toBe(true);
    expect(can(auxiliar, 'changeAnyStatus')).toBe(true);
  });

  it('perfil inativo não edita', () => {
    expect(can({ role: 'admin', active: false }, 'manageTasks')).toBe(false);
    expect(can({ role: 'admin', active: false }, 'changeAnyStatus')).toBe(false);
  });
});

describe('edit aria-label', () => {
  it('adapta o rótulo ao tipo do registro', () => {
    expect(editAriaLabel({ type: 'demanda' })).toBe('Editar demanda');
    expect(editAriaLabel({ type: 'tarefa' })).toBe('Editar tarefa');
    expect(editAriaLabel({ type: 'evento' })).toBe('Editar evento');
    expect(editAriaLabel({ type: 'compromisso' })).toBe('Editar compromisso');
  });
});
