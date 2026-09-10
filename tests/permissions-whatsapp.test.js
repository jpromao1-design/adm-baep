import { describe, expect, it } from 'vitest';
import { can, getRoleLabel, isAdmin } from '../src/lib/permissions.js';
import { buildWhatsAppMessage } from '../src/lib/whatsapp.js';

describe('permissions', () => {
  it('admin gerencia usuários', () => {
    expect(can({ role: 'admin', active: true }, 'manageUsers')).toBe(true);
    expect(isAdmin({ role: 'admin', active: true })).toBe(true);
  });

  it('auxiliar não gerencia usuários', () => {
    expect(can({ role: 'auxiliar', active: true }, 'manageUsers')).toBe(false);
    expect(isAdmin({ role: 'auxiliar', active: true })).toBe(false);
  });

  it('usuário inativo não tem permissão', () => {
    expect(can({ role: 'admin', active: false }, 'manageUsers')).toBe(false);
  });

  it('rótulo de perfil', () => {
    expect(getRoleLabel('admin')).toBe('Administrador');
  });
});

describe('whatsapp message', () => {
  it('monta mensagem com título e status', () => {
    const msg = buildWhatsAppMessage({
      title: 'Relatório mensal',
      type: 'demanda',
      status: 'pendente',
      due_date: '2026-09-10',
      auxiliar: 'Souza',
    });
    expect(msg).toMatch(/Relatório mensal/);
    expect(msg).toMatch(/Demanda/);
    expect(msg).toMatch(/Pendente/);
    expect(msg).toMatch(/Souza/);
  });
});
