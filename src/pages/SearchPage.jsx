import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskIOBar } from '@/components/tasks/TaskIOBar';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
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
    <div className="page-container space-y-4">
      <PageHeader
        title="Busca"
        subtitle="Localize tarefas e demandas rapidamente"
        actions={<TaskIOBar tasks={results.length ? results : tasks} onImport={handleImport} />}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Buscar por título, descrição, local, auxiliar, seção…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 pr-11 h-12 rounded-2xl bg-card"
          autoFocus
          aria-label="Termo de busca"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 touch-target rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <p className="text-xs text-muted-foreground" role="status">
          {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </p>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {results.map((t) => (
            <TaskCard key={t.id} task={t} onClick={modals.openView} onToggleComplete={handleToggleComplete} />
          ))}
        </AnimatePresence>
      </div>

      {!query.trim() && (
        <EmptyState
          icon={Search}
          title="Digite para buscar"
          description="Pesquise por título, descrição, local, auxiliar ou seção. Atalho: tecla / em qualquer tela."
        />
      )}

      {query.trim() && results.length === 0 && (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description={`Não encontramos registros para "${query}". Tente outro termo ou limpe a busca.`}
        />
      )}

      <TaskViewModal
        open={modals.viewModalOpen}
        onClose={modals.closeView}
        task={modals.selectedTask}
        onEdit={modals.openEdit}
        onDelete={handleDelete}
      />
      <TaskFormModal
        open={modals.modalOpen}
        onClose={modals.closeForm}
        task={modals.selectedTask}
        onSave={(row) => handleSave(row)}
        onDelete={handleDelete}
      />
    </div>
  );
}
