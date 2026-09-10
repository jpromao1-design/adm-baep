import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, MapPin, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_LABELS, isOverdue, isTaskDone } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { StatusBadge } from './StatusBadge';
import { StatusQuickSelect } from './StatusQuickSelect';
import { DeadlineIndicator } from '@/components/ui/deadline-indicator';
import { Badge } from '@/components/ui/badge';
import { openWhatsAppShare } from '@/lib/whatsapp';

export function TaskCard({ task, onClick, onToggleComplete, onStatusChange, compact = false, showQuickStatus = false }) {
  const done = isTaskDone(task);
  const overdue = isOverdue(task) && !done;
  const canQuickStatus = showQuickStatus && onStatusChange && !(task.is_recurring && task._occurrenceDate);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(task);
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'bg-card border border-border rounded-2xl p-4 cursor-pointer shadow-card',
        'hover:border-primary/30 hover:shadow-elevated transition-all focus-ring',
        done && 'opacity-75',
        overdue && 'border-destructive/30 bg-destructive/[0.02]'
      )}
    >
      <div className="flex items-start gap-3">
        {onToggleComplete && (
          <button
            type="button"
            className="mt-0.5 text-muted-foreground hover:text-primary shrink-0 touch-target rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
          >
            {done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5" />}
          </button>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {TYPE_LABELS[task.type] || task.type}
              </p>
              <h3 className={cn('text-sm font-bold text-foreground leading-snug', done && 'line-through')}>
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canQuickStatus ? (
                <StatusQuickSelect value={task.status} onChange={(status) => onStatusChange(task, status)} />
              ) : (
                <StatusBadge task={task} />
              )}
              <button
                type="button"
                className="touch-target rounded-lg text-success hover:bg-success/10"
                aria-label="Enviar por WhatsApp"
                onClick={(e) => {
                  e.stopPropagation();
                  openWhatsAppShare(task);
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!compact && (
            <>
              <DeadlineIndicator task={task} showDate />
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {task.section && <Badge variant="primary">{task.section}</Badge>}
                {task.location && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[10rem]">
                    <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" /> {task.location}
                  </span>
                )}
                {getAuxiliar(task) && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[10rem]">
                    <Users className="w-3 h-3 shrink-0" aria-hidden="true" /> {getAuxiliar(task)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
