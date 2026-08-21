import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, getTaskDate } from '@/lib/dates';
import { TYPE_LABELS, isOverdue, isTaskDone } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { StatusBadge } from './StatusBadge';

export function TaskCard({ task, onClick, onToggleComplete, compact = false }) {
  const done = isTaskDone(task);
  const overdue = isOverdue(task);
  const dateStr = getTaskDate(task);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      onClick={() => onClick?.(task)}
      className={cn(
        'bg-card border border-border rounded-2xl p-3.5 cursor-pointer hover:border-primary/30 transition-colors',
        done && 'opacity-70',
        overdue && !done && 'border-rose-200'
      )}
    >
      <div className="flex items-start gap-3">
        {onToggleComplete && (
          <button
            type="button"
            className="mt-0.5 text-muted-foreground hover:text-primary shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            aria-label={done ? 'Reabrir' : 'Concluir'}
          >
            {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-semibold text-foreground', done && 'line-through')}>{task.title}</p>
            <StatusBadge task={task} />
          </div>
          {!compact && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
              <span>{TYPE_LABELS[task.type] || task.type}</span>
              {dateStr && (
                <span className={cn(overdue && !done && 'text-rose-600 font-semibold')}>{formatDate(dateStr)}</span>
              )}
              {task.location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" /> {task.location}
                </span>
              )}
              {task.section && <span>{task.section}</span>}
              {getAuxiliar(task) && (
                <span className="inline-flex items-center gap-1 truncate">
                  <Users className="w-3 h-3" /> {getAuxiliar(task)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
