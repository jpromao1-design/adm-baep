import React from 'react';
import { MessageCircle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { editAriaLabel } from '@/lib/task-status';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { StatusBadge } from './StatusBadge';
import { StatusQuickSelect } from './StatusQuickSelect';

export function TaskCardActions({
  task,
  onStatusChange,
  onEdit,
  showQuickStatus = false,
  canChangeStatus = false,
  canEdit = false,
  statusBusy = false,
  showWhatsApp = true,
  className,
}) {
  const isOccurrence = Boolean(task?.is_recurring && task?._occurrenceDate);
  const canQuickStatus = showQuickStatus && canChangeStatus && onStatusChange && !isOccurrence;

  return (
    <div
      className={cn(
        // Mobile: coluna à direita — status → lápis → WhatsApp
        'flex flex-col items-end gap-1.5 shrink-0',
        // Desktop: linha horizontal (layout anterior)
        'md:flex-row md:items-center md:gap-1',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {canQuickStatus ? (
        <StatusQuickSelect
          value={task.status}
          busy={statusBusy}
          onChange={(status) => onStatusChange(task, status)}
        />
      ) : (
        <StatusBadge task={task} />
      )}

      {canEdit && onEdit && (
        <button
          type="button"
          title="Editar"
          aria-label={editAriaLabel(task)}
          className="touch-target min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {showWhatsApp && (
        <button
          type="button"
          title="WhatsApp"
          className="touch-target min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-success hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Enviar por WhatsApp"
          onClick={(e) => {
            e.stopPropagation();
            openWhatsAppShare(task);
          }}
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
