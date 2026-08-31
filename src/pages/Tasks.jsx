import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { addDays, isThisWeek, isTomorrow, startOfDay } from 'date-fns';
import { ListTodo, Plus } from 'lucide-react';
import { QuickFilters } from '@/components/tasks/QuickFilters';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskIOBar } from '@/components/tasks/TaskIOBar';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useTaskModals } from '@/hooks/useTaskModals';
import { useToggleComplete } from '@/hooks/useToggleComplete';
import { parseDateOnly } from '@/lib/dates';
import { expandRecurringTasks } from '@/lib/recurrence';
import { isDueSoon, isOverdue, isTaskDone } from '@/lib/task-status';

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const shouldOpenNew = searchParams.get('new') === 'true';

  const { tasks, isLoading, handleSave, handleDelete, handleImport } = useTasks();
  const modals = useTaskModals();
  const handleToggleComplete = useToggleComplete();
  const [filter, setFilter] = React.useState(initialFilter);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (!shouldOpenNew) return;
    modals.openNew();
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [shouldOpenNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (next) => {
    setFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('filter');
    else params.set('filter', next);
    setSearchParams(params, { replace: true });
  };

  const filteredTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const expanded = expandRecurringTasks(tasks, addDays(today, -365), addDays(today, 60));

    return expanded
      .filter((t) => {
        const due = parseDateOnly(t._occurrenceDate || t.due_date || t.event_date);
        switch (filter) {
          case 'open':
            return !isTaskDone(t) && t.status !== 'concluido';
          case 'today':
            return due && due.toDateString() === today.toDateString() && !isTaskDone(t);
          case 'tomorrow':
            return due && isTomorrow(due) && !isTaskDone(t);
          case 'week':
            return due && isThisWeek(due, { weekStartsOn: 1 }) && !isTaskDone(t);
          case 'overdue':
            return isOverdue(t);
          case 'in_progress':
            return t.status === 'em_andamento' && !t._occurrenceDate;
          case 'done':
            return isTaskDone(t) || t.status === 'concluido';
          case 'due_soon':
            return isDueSoon(t);
          default:
            return !t._occurrenceDate || !isTaskDone(t);
        }
      })
      .sort((a, b) => {
        const aOverdue = isOverdue(a) ? 0 : 1;
        const bOverdue = isOverdue(b) ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        const ad = a._occurrenceDate || a.due_date || a.event_date;
        const bd = b._occurrenceDate || b.due_date || b.event_date;
        if (ad && bd) return new Date(ad) - new Date(bd);
        if (ad) return -1;
        if (bd) return 1;
        return 0;
      });
  }, [tasks, filter]);

  if (isLoading) return <PageLoadingState />;

  return (
    <div className="page-container space-y-4">
      <PageHeader
        title="Tarefas"
        subtitle={`${filteredTasks.length} ${filteredTasks.length === 1 ? 'registro' : 'registros'}`}
        actions={
          <>
            <TaskIOBar tasks={filteredTasks} onImport={handleImport} />
            <Button className="hidden md:inline-flex" onClick={() => modals.openNew()}>
              <Plus className="w-4 h-4" /> Nova
            </Button>
          </>
        }
      />

      <QuickFilters active={filter} onChange={handleFilterChange} />

      <TaskTable
        tasks={filteredTasks}
        onView={modals.openView}
        onEdit={modals.openEdit}
        onToggleComplete={handleToggleComplete}
      />

      <div className="lg:hidden space-y-2">
        <AnimatePresence>
          {filteredTasks.map((t) => (
            <TaskCard
              key={`${t.id}-${t._occurrenceDate || 'base'}`}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredTasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa encontrada"
          description="Crie uma nova tarefa ou altere os filtros utilizados."
          actionLabel="Nova tarefa"
          onAction={() => modals.openNew()}
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
