import React from 'react';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'open', label: 'Abertas' },
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'week', label: 'Semana' },
  { id: 'due_soon', label: 'Em breve' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'in_progress', label: 'Andamento' },
  { id: 'done', label: 'Concluídas' },
];

export function QuickFilters({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            'shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
            active === f.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
