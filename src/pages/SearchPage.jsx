import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskIOBar } from '@/components/tasks/TaskIOBar';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { useTasks } from '@/hooks/useTasks';
import { useTaskModals } from '@/hooks/useTaskModals';
import { useToggleComplete } from '@/hooks/useToggleComplete';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { tasks, handleSave, handleDelete, handleImport } = useTasks();
  const modals = useTaskModals();
  const handleToggleComplete = useToggleComplete();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.auxiliar?.toLowerCase().includes(q) ||
        t.involved?.toLowerCase().includes(q) ||
        t.section?.toLowerCase().includes(q) ||
        t.observations?.toLowerCase().includes(q)
    );
  }, [tasks, query]);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Busca</h1>
        <TaskIOBar tasks={results.length ? results : tasks} onImport={handleImport} />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, descrição, local, auxiliar, seção..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 pr-10 h-12 rounded-2xl bg-card border-border text-sm"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <p className="text-xs text-muted-foreground">
          {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
        </p>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {results.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </AnimatePresence>
      </div>

      {!query.trim() && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Digite para buscar suas tarefas</p>
        </div>
      )}

      <TaskViewModal open={modals.viewModalOpen} onClose={modals.closeView} task={modals.selectedTask} onEdit={modals.openEdit} onDelete={handleDelete} />
      <TaskFormModal open={modals.modalOpen} onClose={modals.closeForm} task={modals.selectedTask} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}
