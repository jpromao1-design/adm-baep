import React, { useEffect, useState } from 'react';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { ModalShell } from '@/components/ui/modal-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
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

function isDomOrReactEvent(value) {
  return Boolean(
    value && typeof value === 'object' && (typeof value.preventDefault === 'function' || value.nativeEvent)
  );
}

function formFromSource(task) {
  const next = { ...EMPTY };
  if (!task || isDomOrReactEvent(task)) return next;

  for (const key of Object.keys(EMPTY)) {
    const value = task[key];
    if (value == null || typeof value === 'object') continue;
    next[key] = value;
  }

  if (typeof task.id === 'string') next.id = task.id;
  next.auxiliar = getAuxiliar(task);
  next.section = task.section || '';
  next.received_date = task.received_date || '';
  next.start_date = task.start_date || '';
  next.due_date = task.due_date || '';
  next.end_date = task.end_date || '';
  next.event_date = task.event_date || '';
  next.event_time = task.event_time || '';
  next.recurrence = task.recurrence || '';
  next.recurrence_end_date = task.recurrence_end_date || '';
  next.remind_on_day = task.remind_on_day !== false;
  next.remind_day_before = task.remind_day_before !== false;
  next.is_recurring = Boolean(task.is_recurring);
  return next;
}

export function TaskFormModal({ open, onClose, task, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEvent = form.type === 'evento' || form.type === 'compromisso';

  useEffect(() => {
    if (!open) return;
    setError('');
    setConfirmDelete(false);
    setForm(formFromSource(task));
  }, [open, task]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveRecord = async () => {
    if (!String(form.title || '').trim()) {
      setError('Informe o título da tarefa.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        id: typeof form.id === 'string' ? form.id : undefined,
        title: String(form.title || '').trim(),
        description: String(form.description || '').trim(),
        type: form.type,
        status: form.status,
        section: form.section || null,
        received_date: form.received_date || null,
        start_date: form.start_date || null,
        due_date: isEvent ? null : form.due_date || null,
        end_date: form.end_date || null,
        event_date: isEvent ? form.event_date || null : null,
        event_time: isEvent ? form.event_time || null : null,
        location: String(form.location || '').trim(),
        auxiliar: String(form.auxiliar || '').trim(),
        notes: String(form.notes || '').trim(),
        observations: String(form.observations || '').trim(),
        remind_on_day: Boolean(form.remind_on_day),
        remind_day_before: Boolean(form.remind_day_before),
        is_recurring: Boolean(form.is_recurring),
        recurrence: form.is_recurring ? form.recurrence || null : null,
        recurrence_end_date: form.is_recurring ? form.recurrence_end_date || null : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Não foi possível salvar a alteração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err?.message || 'Não foi possível excluir o registro.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const footer = (
    <div className="flex gap-2">
      {task?.id && onDelete && (
        <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
          Excluir
        </Button>
      )}
      <Button variant="outline" onClick={onClose} disabled={saving} className="ml-auto">
        Cancelar
      </Button>
      <Button onClick={() => void saveRecord()} disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  );

  return (
    <>
      <ModalShell
        open={open}
        onClose={onClose}
        title={task?.id ? 'Editar tarefa' : 'Nova tarefa'}
        size="lg"
        footer={footer}
      >
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2 mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="task-title">Título</Label>
            <Input id="task-title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="task-type">Tipo</Label>
              <Select id="task-type" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="tarefa">Tarefa</option>
                <option value="demanda">Demanda</option>
                <option value="evento">Evento</option>
                <option value="compromisso">Compromisso</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-status">Status</Label>
              <Select id="task-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="aguardando">Aguardando</option>
                <option value="concluido">Concluída</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-section">Seção</Label>
              <Select id="task-section" value={form.section} onChange={(e) => set('section', e.target.value)}>
                <option value="">Selecione</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-date">{isEvent ? 'Data do evento' : 'Prazo'}</Label>
              <Input
                id="task-date"
                type="date"
                value={isEvent ? form.event_date : form.due_date}
                onChange={(e) => set(isEvent ? 'event_date' : 'due_date', e.target.value)}
              />
            </div>
          </div>

          {isEvent && (
            <div className="space-y-1">
              <Label htmlFor="task-time">Horário</Label>
              <Input id="task-time" type="time" value={form.event_time} onChange={(e) => set('event_time', e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="task-location">Local</Label>
              <Input id="task-location" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-auxiliar">Auxiliar</Label>
              <Input id="task-auxiliar" value={form.auxiliar} onChange={(e) => set('auxiliar', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea id="task-description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="task-observations">Observações</Label>
            <Textarea id="task-observations" value={form.observations} onChange={(e) => set('observations', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm min-h-11">
            <input type="checkbox" checked={form.is_recurring} onChange={(e) => set('is_recurring', e.target.checked)} />
            Recorrente
          </label>

          {form.is_recurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="space-y-1">
                <Label htmlFor="task-recurrence">Frequência</Label>
                <Select id="task-recurrence" value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
                  <option value="">Selecione</option>
                  {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="task-start">Início da série</Label>
                <Input id="task-start" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="task-recurrence-end">Término da recorrência (opcional)</Label>
                <Input
                  id="task-recurrence-end"
                  type="date"
                  value={form.recurrence_end_date}
                  onChange={(e) => set('recurrence_end_date', e.target.value)}
                />
              </div>
            </div>
          )}

          <fieldset className="flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground border-0 p-0">
            <legend className="sr-only">Lembretes</legend>
            <label className="flex items-center gap-2 min-h-11">
              <input type="checkbox" checked={form.remind_on_day} onChange={(e) => set('remind_on_day', e.target.checked)} />
              Lembrar no dia
            </label>
            <label className="flex items-center gap-2 min-h-11">
              <input type="checkbox" checked={form.remind_day_before} onChange={(e) => set('remind_day_before', e.target.checked)} />
              Lembrar no dia anterior
            </label>
          </fieldset>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir tarefa?"
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
