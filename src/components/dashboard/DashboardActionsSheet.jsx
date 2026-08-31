import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileSpreadsheet, KeyRound, LogOut, Upload, X } from 'lucide-react';
import { exportTasksCsv, exportTasksXlsx, parseImportFile, validateImportRows } from '@/lib/task-io';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';

export function DashboardActionsSheet({ open, onClose, tasks, onImport, onSignOut }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const runImport = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await parseImportFile(file);
      const { accepted, errors } = validateImportRows(rows);
      if (!accepted.length) {
        toast({
          title: 'Nenhum registro válido',
          description: errors.slice(0, 4).join(' '),
          tone: 'danger',
        });
        return;
      }
      await onImport(accepted);
      toast({
        title: `${accepted.length} ${accepted.length === 1 ? 'registro importado' : 'registros importados'}`,
        description: errors.length ? `${errors.length} linha(s) ignorada(s).` : undefined,
        tone: 'success',
      });
      onClose();
    } catch (err) {
      toast({ title: 'Falha na importação', description: err.message, tone: 'danger' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

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
          aria-labelledby="dashboard-actions-title"
        >
          <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Fechar menu" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 id="dashboard-actions-title" className="text-base font-bold">
                Menu
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-3 py-2 space-y-0.5">
              <Link
                to="/alterar-senha"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted min-h-11 text-sm font-medium"
              >
                <KeyRound className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                Alterar senha
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/5 text-destructive min-h-11 text-sm font-medium"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                Sair
              </button>
            </div>

            <div className="mx-5 my-2 border-t border-border" />

            <div className="px-3 py-2 space-y-0.5">
              <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Dados</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted min-h-11 text-sm font-medium disabled:opacity-50"
              >
                <Upload className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                {busy ? 'Importando…' : 'Importar dados'}
              </button>
              <button
                type="button"
                disabled={!tasks.length}
                onClick={() => {
                  exportTasksXlsx(tasks);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted min-h-11 text-sm font-medium disabled:opacity-50"
              >
                <FileSpreadsheet className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                Exportar Excel
              </button>
              <button
                type="button"
                disabled={!tasks.length}
                onClick={() => {
                  exportTasksCsv(tasks);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted min-h-11 text-sm font-medium disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                Exportar CSV
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={(e) => runImport(e.target.files?.[0])}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
