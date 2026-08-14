import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Pencil, Trash2, Users, X } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { PRIORITY_CONFIG, TYPE_LABELS } from '@/lib/task-status';
import { RECURRENCE_LABELS } from '@/lib/recurrence';
import { StatusBadge } from './StatusBadge';

export function TaskViewModal({ open, onClose, task, onEdit, onDelete }) {
  if (!task) return null;

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
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative w-full max-w-lg bg-card rounded-t-3xl md:rounded-3xl border border-border p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{TYPE_LABELS[task.type] || task.type}</p>
                <h2 className="text-lg font-bold text-foreground leading-tight">{task.title}</h2>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge task={task} />
              {task.priority && (
                <span className={`text-[10px] font-bold ${PRIORITY_CONFIG[task.priority]?.className || ''}`}>
                  {PRIORITY_CONFIG[task.priority]?.label}
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              {(task._occurrenceDate || task.due_date || task.event_date) && (
                <p>Prazo: {formatDate(task._occurrenceDate || task.event_date || task.due_date)}</p>
              )}
              {task.event_time && <p>Horário: {task.event_time}</p>}
              {task.location && (
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {task.location}</p>
              )}
              {task.involved && (
                <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {task.involved}</p>
              )}
              {task.is_recurring && <p>Recorrência: {RECURRENCE_LABELS[task.recurrence] || task.recurrence}</p>}
              {task.description && <p className="text-foreground whitespace-pre-wrap">{task.description}</p>}
              {task.observations && <p className="whitespace-pre-wrap">{task.observations}</p>}
              {task.notes && <p className="whitespace-pre-wrap">{task.notes}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              {onDelete && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5"
                  onClick={async () => {
                    if (window.confirm('Excluir esta tarefa?')) {
                      await onDelete(task.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
