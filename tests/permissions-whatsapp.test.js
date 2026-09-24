import { describe, expect, it } from 'vitest';
import { can, getRoleLabel, isAdmin } from '../src/lib/permissions.js';
import {
  buildWhatsAppMessage,
  buildWhatsAppShareUrl,
  formatTaskWhatsAppMessage,
} from '../src/lib/whatsapp.js';

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
  const fullTask = {
    id: 'abc-123',
    title: 'PLANO DE CHAMADA',
    type: 'demanda',
    status: 'aguardando',
    due_date: '2026-09-15',
    section: 'P3',
    auxiliar: 'Sgt PM Silva',
    description: 'Providenciar atualização do plano de chamada.',
    observations: 'Encaminhar até às 17h.',
  };

  it('monta mensagem completa com campos relevantes', () => {
    const msg = buildWhatsAppMessage(fullTask);
    expect(msg).toContain('📌 *DEMANDA — 8º BAEP*');
    expect(msg).toContain('*PLANO DE CHAMADA*');
    expect(msg).toContain('📅 *Prazo:* 15/09/2026');
    expect(msg).toContain('⏳ *Status:* Aguardando');
    expect(msg).toContain('👤 *Responsável:* Sgt PM Silva');
    expect(msg).toContain('🏢 *Seção:* P3');
    expect(msg).toContain('📝 *Observação:*');
    expect(msg).toContain('Providenciar atualização');
    expect(msg).toContain('*8º BAEP*');
    expect(msg).not.toContain('🛡️');
  });

  it('omite campos vazios e não inclui undefined/null', () => {
    const msg = buildWhatsAppMessage({
      title: 'Só o essencial',
      type: 'tarefa',
      status: 'pendente',
      due_date: '2026-09-18',
      auxiliar: null,
      section: '',
      description: undefined,
      observations: null,
      priority: null,
    });
    expect(msg).toContain('📋 *TAREFA — 8º BAEP*');
    expect(msg).toContain('*Só o essencial*');
    expect(msg).toContain('📅 *Prazo:* 18/09/2026');
    expect(msg).toContain('⏳ *Status:* Pendente');
    expect(msg).not.toMatch(/undefined/i);
    expect(msg).not.toMatch(/\bnull\b/i);
    expect(msg).not.toContain('Responsável');
    expect(msg).not.toContain('Seção');
    expect(msg).not.toContain('Observação');
    expect(msg).not.toContain('Prioridade');
  });

  it('não inclui link do sistema Adm BAEP', () => {
    const msg = buildWhatsAppMessage({
      id: 'x1',
      title: 'Sem link',
      type: 'demanda',
      status: 'pendente',
      due_date: '2026-09-15',
    });
    expect(msg).not.toMatch(/adm-baep\.vercel\.app/i);
    expect(msg).not.toMatch(/https?:\/\//i);
    expect(msg).not.toMatch(/github\.io/i);
    expect(msg).not.toMatch(/\/tasks/i);
  });

  it('usa negrito do WhatsApp com asterisco simples', () => {
    const msg = buildWhatsAppMessage({
      title: 'Teste',
      type: 'tarefa',
      status: 'em_andamento',
      due_date: '2026-09-20',
    });
    expect(msg).toContain('*Prazo:*');
    expect(msg).toContain('*Status:*');
    expect(msg).not.toContain('**Prazo:**');
    expect(msg).not.toContain('**Status:**');
  });

  it('preserva acentos, º e emojis', () => {
    const msg = buildWhatsAppMessage({
      title: 'Relação de interessados — 8º BAEP',
      type: 'demanda',
      status: 'pendente',
      due_date: '2026-09-15',
      description: 'Atenção: atualização até às 17h com acentuação (ção, ã, é).',
    });
    expect(msg).toContain('8º BAEP');
    expect(msg).toContain('📌');
    expect(msg).not.toContain('🛡️');
    expect(msg).toContain('*8º BAEP*');
  });

  it('diferencia DEMANDA e TAREFA no cabeçalho', () => {
    const demanda = buildWhatsAppMessage({ title: 'A', type: 'demanda', status: 'pendente' });
    const tarefa = buildWhatsAppMessage({ title: 'B', type: 'tarefa', status: 'pendente' });
    expect(demanda).toContain('📌 *DEMANDA — 8º BAEP*');
    expect(tarefa).toContain('📋 *TAREFA — 8º BAEP*');
  });

  it('formatTaskWhatsAppMessage é alias da mesma função', () => {
    const task = { title: 'Alias', type: 'tarefa', status: 'concluido' };
    expect(formatTaskWhatsAppMessage(task)).toBe(buildWhatsAppMessage(task));
    expect(formatTaskWhatsAppMessage(task)).toContain('⏳ *Status:* Concluída');
  });

  it('URL técnica de abertura usa wa.me com texto codificado', () => {
    const url = buildWhatsAppShareUrl({
      title: 'Abrir WhatsApp',
      type: 'demanda',
      status: 'pendente',
      due_date: '2026-09-15',
    });
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    const encoded = url.slice('https://wa.me/?text='.length);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toContain('📌 *DEMANDA — 8º BAEP*');
    expect(decoded).toContain('*Abrir WhatsApp*');
    expect(decoded).not.toMatch(/adm-baep\.vercel\.app/i);
  });
});
