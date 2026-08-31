import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './button';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={onCancel}
            aria-label="Fechar"
          />
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-5 shadow-xl"
          >
            <h2 id="confirm-title" className="text-base font-bold text-foreground">
              {title}
            </h2>
            {description && (
              <p id="confirm-desc" className="text-sm text-muted-foreground mt-2">
                {description}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                className="flex-1"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Aguarde…' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
