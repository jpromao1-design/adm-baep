import React, { useState } from 'react';
import { MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { ModalShell } from '@/components/ui/modal-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeadlineIndicator } from '@/components/ui/deadline-indicator';
import { formatDate } from '@/lib/dates';
import { TYPE_LABELS } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { RECURRENCE_LABELS } from '@/lib/recurrence';
import { StatusBadge } from './StatusBadge';

function DetailSection({ title, children }) {
  if (!children) return null;
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="text-sm text-foreground">{children}</div>
    </section>
  );
}

export function TaskViewModal({ open, onClose, task, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const footer = (
    <div className="flex gap-2">
      {onDelete && (
        <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-4 h-4" /> Excluir
        </Button>
      )}
      {onEdit && (
        <Button className="ml-auto" onClick={() => onEdit(task)}>
          <Pencil className="w-4 h-4" /> Editar
        </Button>
      )}
    </div>
  );

  return (
    <>
      <ModalShell open={open} onClose={onClose} title={task.title} size="md" footer={footer}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{TYPE_LABELS[task.type] || task.type}</Badge>
            <StatusBadge task={task} />
            {task.section && <Badge variant="info">{task.section}</Badge>}
          </div>

          <DeadlineIndicator task={task} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(task._occurrenceDate || task.due_date || task.event_date) && (
              <DetailSection title="Data">
                <p>{formatDate(task._occurrenceDate || task.event_date || task.due_date)}</p>
              </DetailSection>
            )}
            {task.event_time && (
              <DetailSection title="Horário">
                <p>{task.event_time}</p>
              </DetailSection>
            )}
            {task.location && (
              <DetailSection title="Local">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {task.location}
                </p>
              </DetailSection>
            )}
            {getAuxiliar(task) && (
              <DetailSection title="Auxiliar">
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {getAuxiliar(task)}
                </p>
              </DetailSection>
            )}
            {task.is_recurring && (
              <DetailSection title="Recorrência">
                <p>{RECURRENCE_LABELS[task.recurrence] || task.recurrence}</p>
              </DetailSection>
            )}
          </div>

          {task.description && (
            <DetailSection title="Descrição">
              <p className="whitespace-pre-wrap">{task.description}</p>
            </DetailSection>
          )}
          {task.observations && (
            <DetailSection title="Observações">
              <p className="whitespace-pre-wrap text-muted-foreground">{task.observations}</p>
            </DetailSection>
          )}
          {task.notes && (
            <DetailSection title="Notas">
              <p className="whitespace-pre-wrap text-muted-foreground">{task.notes}</p>
            </DetailSection>
          )}
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
