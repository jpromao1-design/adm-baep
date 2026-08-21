import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { RECURRENCE_LABELS } from '@/lib/recurrence';
import { SECTIONS, getAuxiliar } from '@/lib/sections';

const EMPTY = {
  title: '',
  description: '',
  type: 'tarefa',
  status: 'pendente',
  section: '',
  received_date: '',
  start_date: '',
  due_date: '',
  end_date: '',
  event_date: '',
  event_time: '',
  location: '',
  auxiliar: '',
  notes: '',
  observations: '',
  remind_on_day: true,
  remind_day_before: true,
  is_recurring: false,
  recurrence: '',
  recurrence_end_date: '',
};

export function TaskFormModal({ open, onClose, task, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const isEvent = form.type === 'evento' || form.type === 'compromisso';

  useEffect(() => {
    if (!open) return;
    if (task) {
      const { priority, involved, ...rest } = task;
      setForm({
        ...EMPTY,
        ...rest,
        received_date: task.received_date || '',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        end_date: task.end_date || '',
        event_date: task.event_date || '',
        event_time: task.event_time || '',
        auxiliar: getAuxiliar(task),
        section: task.section || '',
        recurrence: task.recurrence || '',
        recurrence_end_date: task.recurrence_end_date || '',
        remind_on_day: task.remind_on_day !== false,
        remind_day_before: task.remind_day_before !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, task]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        received_date: form.received_date || null,
        start_date: form.start_date || null,
        due_date: isEvent ? null : form.due_date || null,
        end_date: form.end_date || null,
        event_date: isEvent ? form.event_date || null : null,
        event_time: isEvent ? form.event_time || null : null,
        recurrence: form.is_recurring ? form.recurrence || null : null,
        recurrence_end_date: form.is_recurring ? form.recurrence_end_date || null : null,
        auxiliar: form.auxiliar.trim() || null,
        section: form.section || null,
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar" />
          <motion.form
            onSubmit={submit}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-card rounded-t-3xl md:rounded-3xl border border-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{task?.id ? 'Editar' : 'Nova tarefa'}</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <Label>Título</Label>
              <Input required value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="tarefa">Tarefa</option>
                  <option value="demanda">Demanda</option>
                  <option value="evento">Evento</option>
                  <option value="compromisso">Compromisso</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="concluido">Concluída</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Seção</Label>
                <Select value={form.section} onChange={(e) => set('section', e.target.value)}>
                  <option value="">Selecione</option>
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{isEvent ? 'Data do evento' : 'Prazo'}</Label>
                <Input
                  type="date"
                  value={isEvent ? form.event_date : form.due_date}
                  onChange={(e) => set(isEvent ? 'event_date' : 'due_date', e.target.value)}
                />
              </div>
            </div>

            {isEvent && (
              <div className="space-y-1">
                <Label>Horário</Label>
                <Input type="time" value={form.event_time} onChange={(e) => set('event_time', e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Local</Label>
                <Input value={form.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Auxiliar</Label>
                <Input value={form.auxiliar} onChange={(e) => set('auxiliar', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea value={form.observations} onChange={(e) => set('observations', e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) => set('is_recurring', e.target.checked)}
              />
              Recorrente
            </label>

            {form.is_recurring && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Frequência</Label>
                  <Select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
                    <option value="">Selecione</option>
                    {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Início da série</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Término da recorrência (opcional)</Label>
                  <Input type="date" value={form.recurrence_end_date} onChange={(e) => set('recurrence_end_date', e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.remind_on_day} onChange={(e) => set('remind_on_day', e.target.checked)} />
                Lembrar no dia
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.remind_day_before} onChange={(e) => set('remind_day_before', e.target.checked)} />
                Lembrar no dia anterior
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              {task?.id && onDelete && (
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5"
                  onClick={async () => {
                    if (window.confirm('Excluir esta tarefa?')) {
                      await onDelete(task.id);
                      onClose();
                    }
                  }}
                >
                  Excluir
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="ml-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
