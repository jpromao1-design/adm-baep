import React from 'react';
import { STATUS_CONFIG } from '@/lib/task-status';
import { cn } from '@/lib/utils';

const OPTIONS = ['pendente', 'em_andamento', 'aguardando', 'concluido'];

export function StatusQuickSelect({ value, onChange, disabled = false, className }) {
  return (
    <select
      value={value || 'pendente'}
      disabled={disabled}
      aria-label="Alterar status"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange?.(e.target.value);
      }}
      className={cn(
        'text-[11px] font-semibold rounded-lg border border-border bg-card px-2 py-1.5',
        'focus:outline-none focus:ring-2 focus:ring-ring min-h-9 max-w-[9.5rem]',
        className
      )}
    >
      {OPTIONS.map((key) => (
        <option key={key} value={key}>
          {STATUS_CONFIG[key]?.label || key}
        </option>
      ))}
    </select>
  );
}
