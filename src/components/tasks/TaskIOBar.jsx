import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { exportTasksCsv, exportTasksXlsx, parseImportFile, validateImportRows } from '@/lib/task-io';
import { toast } from '@/components/ui/toaster';

export function TaskIOBar({ tasks, onImport }) {
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
      });
    } catch (err) {
      toast({ title: 'Falha na importação', description: err.message, tone: 'danger' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!tasks.length}
        onClick={() => exportTasksXlsx(tasks)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
      </button>
      <button
        type="button"
        disabled={!tasks.length}
        onClick={() => exportTasksCsv(tasks)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Download className="w-3.5 h-3.5" /> CSV
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Upload className="w-3.5 h-3.5" /> {busy ? 'Importando…' : 'Importar'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(e) => runImport(e.target.files?.[0])}
      />
    </div>
  );
}
