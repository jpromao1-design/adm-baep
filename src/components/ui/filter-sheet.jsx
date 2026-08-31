import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Badge } from './badge';

export function FilterSheetTrigger({ activeCount = 0, onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-haspopup="dialog">
      <SlidersHorizontal className="w-4 h-4" />
      Filtros
      {activeCount > 0 && <Badge variant="primary">{activeCount}</Badge>}
    </Button>
  );
}

export function FilterSheet({ open, onClose, title = 'Filtros', activeCount = 0, onApply, onClear, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-sheet-title"
        >
          <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Fechar filtros" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border max-h-[80dvh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 id="filter-sheet-title" className="text-base font-bold">
                  {title}
                </h2>
                {activeCount > 0 && <Badge variant="primary">{activeCount} ativos</Badge>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-wrap gap-2">{children}</div>
            <div className="flex gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={onClear}>
                Limpar filtros
              </Button>
              <Button className="flex-1" onClick={onApply}>
                Aplicar filtros
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-11 focus-ring',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
