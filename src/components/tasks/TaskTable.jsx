import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_LABELS, isOverdue, isTaskDone } from '@/lib/task-status';
import { getAuxiliar } from '@/lib/sections';
import { StatusBadge } from './StatusBadge';
import { DeadlineIndicator } from '@/components/ui/deadline-indicator';
import { Button } from '@/components/ui/button';

export function TaskTable({ tasks, onView, onEdit, onToggleComplete }) {
  const [menuOpen, setMenuOpen] = useState(null);

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aOver = isOverdue(a) && !isTaskDone(a) ? 0 : 1;
        const bOver = isOverdue(b) && !isTaskDone(b) ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return (a.title || '').localeCompare(b.title || '', 'pt-BR');
      }),
    [tasks]
  );

  return (
    <div className="hidden lg:block bg-card border border-border rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-3 py-3" scope="col">
                <span className="sr-only">Concluir</span>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground" scope="col">
                Título
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-28" scope="col">
                Tipo
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-32" scope="col">
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-40" scope="col">
                Prazo
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-20" scope="col">
                Seção
              </th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-36" scope="col">
                Auxiliar
              </th>
              <th className="w-16 px-3 py-3 sticky right-0 bg-muted/40" scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const done = isTaskDone(task);
              const overdue = isOverdue(task) && !done;
              const rowKey = `${task.id}-${task._occurrenceDate || 'base'}`;

              return (
                <tr
                  key={rowKey}
                  className={cn(
                    'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                    overdue && 'bg-destructive/[0.03]'
                  )}
                >
                  <td className="px-3 py-3">
                    {onToggleComplete && (
                      <button
                        type="button"
                        className="table-action p-1.5 rounded-lg text-muted-foreground hover:text-primary focus-ring"
                        onClick={() => onToggleComplete(task)}
                        aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={cn(
                        'text-left font-semibold text-foreground hover:text-primary transition-colors max-w-xs truncate block',
                        done && 'line-through opacity-70'
                      )}
                      onClick={() => onView?.(task)}
                    >
                      {task.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[task.type] || task.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge task={task} />
                  </td>
                  <td className="px-4 py-3">
                    <DeadlineIndicator task={task} compact showDate={false} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{task.section || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[9rem]">
                    {getAuxiliar(task) || '—'}
                  </td>
                  <td className="px-3 py-3 sticky right-0 bg-card">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="table-action"
                        aria-label="Ações"
                        onClick={() => setMenuOpen(menuOpen === rowKey ? null : rowKey)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {menuOpen === rowKey && (
                        <>
                          <button
                            type="button"
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                            aria-label="Fechar menu"
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 min-w-[9rem] bg-card border border-border rounded-xl shadow-elevated py-1">
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left"
                              onClick={() => {
                                onView?.(task);
                                setMenuOpen(null);
                              }}
                            >
                              <Eye className="w-4 h-4" /> Visualizar
                            </button>
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left"
                              onClick={() => {
                                onEdit?.(task);
                                setMenuOpen(null);
                              }}
                            >
                              <Pencil className="w-4 h-4" /> Editar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
