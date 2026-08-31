import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FilterChip, FilterSheet, FilterSheetTrigger } from '@/components/ui/filter-sheet';

export const FILTER_OPTIONS = [
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(active);
  const activeCount = active !== 'all' ? 1 : 0;

  const openSheet = () => {
    setDraft(active);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* Desktop / tablet: horizontal chips */}
      <div className="hidden md:flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <FilterChip key={f.id} active={active === f.id} onClick={() => onChange(f.id)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      {/* Mobile: filter sheet */}
      <div className="md:hidden flex items-center gap-2">
        <FilterSheetTrigger activeCount={activeCount} onClick={openSheet} />
        <FilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          activeCount={activeCount}
          onClear={() => {
            onChange('all');
            setSheetOpen(false);
          }}
          onApply={() => {
            onChange(draft);
            setSheetOpen(false);
          }}
        >
          {FILTER_OPTIONS.map((f) => (
            <FilterChip key={f.id} active={draft === f.id} onClick={() => setDraft(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </FilterSheet>
        {active !== 'all' && (
          <span className="text-xs text-muted-foreground">
            {FILTER_OPTIONS.find((f) => f.id === active)?.label}
          </span>
        )}
      </div>
    </div>
  );
}
