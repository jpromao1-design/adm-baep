import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { STATUS_CONFIG, TASK_STATUS_VALUES } from '@/lib/task-status';
import { cn } from '@/lib/utils';

export function StatusQuickSelect({ value, onChange, disabled = false, busy = false, className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const current = value && TASK_STATUS_VALUES.includes(value) ? value : 'pendente';
  const cfg = STATUS_CONFIG[current] || STATUS_CONFIG.pendente;
  const locked = disabled || busy;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn('relative shrink-0', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={locked}
        aria-label="Alterar status"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        title="Alterar status"
        onClick={() => {
          if (!locked) setOpen((prev) => !prev);
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold min-h-9 max-w-[9.5rem]',
          'border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          cfg.className,
          locked && 'opacity-60 cursor-not-allowed'
        )}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{cfg.label}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden="true" />
      </button>

      {open && !locked && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Status da tarefa"
          className="absolute right-0 top-full z-40 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-elevated"
        >
          {TASK_STATUS_VALUES.map((key) => {
            const option = STATUS_CONFIG[key];
            const selected = key === current;
            return (
              <li key={key} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none min-h-10',
                    selected && 'bg-muted/70'
                  )}
                  onClick={() => {
                    setOpen(false);
                    if (key !== current) onChange?.(key);
                  }}
                >
                  {option?.label || key}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
