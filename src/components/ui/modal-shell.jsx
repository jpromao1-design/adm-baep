import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function ModalShell({ open, onClose, title, children, footer, size = 'md', className }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-3xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Fechar" />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-xl',
              'max-h-[92dvh] flex flex-col',
              sizes[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-border shrink-0">
                <h2 id="modal-title" className="text-base font-bold text-foreground">
                  {title}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="overflow-y-auto flex-1 px-5 py-4 overscroll-contain">{children}</div>
            {footer && (
              <div className="px-5 py-4 border-t border-border shrink-0 bg-card/95">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
