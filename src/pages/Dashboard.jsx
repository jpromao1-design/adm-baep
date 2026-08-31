import React, { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { addDays, startOfDay } from 'date-fns';
import { ListTodo, Plus } from 'lucide-react';
import { NotificationBanner } from '@/components/dashboard/NotificationBanner';
import { StatsRow, StatsRowDesktopIO } from '@/components/dashboard/StatsRow';
import { MobileDashboardHeader } from '@/components/dashboard/MobileDashboardHeader';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { DeadlineCard, DueSoonEmpty } from '@/components/dashboard/DeadlineCard';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useTaskModals } from '@/hooks/useTaskModals';
import { useToggleComplete } from '@/hooks/useToggleComplete';
import { checkAndNotifyTasks, requestNotificationPermission } from '@/lib/notifications';
import { expandRecurringTasks, isOccurrenceCompleted } from '@/lib/recurrence';
import { getTaskDate, toDateStr, todayStr, formatDateLong } from '@/lib/dates';
import { isOverdue } from '@/lib/task-status';

export default function Dashboard() {
  const { tasks, isLoading, handleSave, handleDelete, handleImport } = useTasks();
  const modals = useTaskModals();
  const handleToggleComplete = useToggleComplete();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) checkAndNotifyTasks(tasks);
  }, [tasks]);

  const { overdueTasks, todayTasks, dueSoonTasks, recentDone, eventsToday, counts } = useMemo(() => {
    const today = startOfDay(new Date());
    const in4days = addDays(today, 4);
    const expanded = expandRecurringTasks(tasks, today, in4days);
    const todayKey = todayStr();

    const notDone = expanded.filter((t) => {
      if (t.is_recurring && t._occurrenceDate) {
        return !isOccurrenceCompleted(t, t._occurrenceDate);
      }
      return t.status !== 'concluido';
    });

    const expandedPast = expandRecurringTasks(tasks, addDays(today, -365), today);
    const overdueRaw = expandedPast.filter((t) => t.status !== 'concluido' && isOverdue(t));
    const overdueMap = new Map();
    overdueRaw.forEach((t) => {
      if (!t.is_recurring) {
        overdueMap.set(`fixed-${t.id}`, t);
        return;
      }
      const existing = overdueMap.get(t.id);
      if (!existing || new Date(getTaskDate(t)) > new Date(getTaskDate(existing))) overdueMap.set(t.id, t);
    });
    const overdueTasks = [...overdueMap.values()].sort(
      (a, b) => new Date(getTaskDate(a)) - new Date(getTaskDate(b))
    );

    const todayItems = notDone.filter((t) => getTaskDate(t) === todayKey);
    const eventsToday = todayItems.filter((t) => t.type === 'evento' || t.type === 'compromisso');
    const todayTasks = todayItems.filter((t) => t.type !== 'evento' && t.type !== 'compromisso');

    const in4daysStr = toDateStr(in4days);
    const dueSoonTasks = notDone.filter((t) => {
      const d = getTaskDate(t);
      if (!d || d === todayKey) return false;
      return d > todayKey && d <= in4daysStr;
    });

    const recurringDoneToday = expanded.filter(
      (t) => t.is_recurring && t._occurrenceDate && isOccurrenceCompleted(t, t._occurrenceDate)
    );
    const recentDone = [...tasks.filter((t) => t.status === 'concluido'), ...recurringDoneToday]
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
      .slice(0, 5);

    return {
      overdueTasks,
      todayTasks,
      dueSoonTasks,
      recentDone,
      eventsToday,
      counts: {
        total: tasks.filter((t) => t.status !== 'concluido').length,
        in_progress: tasks.filter((t) => t.status === 'em_andamento').length,
        done: tasks.filter((t) => t.status === 'concluido').length,
        overdue: overdueTasks.length,
      },
    };
  }, [tasks]);

  if (isLoading) return <PageLoadingState />;

  const dateLabel = formatDateLong(new Date());

  return (
    <div className="page-container dashboard-page space-y-5 md:space-y-6">
      {/* Mobile: header dedicado */}
      <MobileDashboardHeader tasks={tasks} onImport={handleImport} />

      {/* Desktop: header tradicional */}
      <div className="hidden md:block">
        <PageHeader
          title="Início"
          subtitle={dateLabel}
          actions={
            <>
              <StatsRowDesktopIO tasks={tasks} onImport={handleImport} />
              <NotificationBell tasks={tasks} />
              <Button onClick={() => modals.openNew()}>
                <Plus className="w-4 h-4" /> Nova Tarefa
              </Button>
            </>
          }
        />
      </div>

      <div>
        <h2 className="md:hidden text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
          Resumo
        </h2>
        <StatsRow counts={counts} />
      </div>

      <NotificationBanner
        overdueCount={overdueTasks.length}
        dueTodayCount={todayTasks.length}
        eventsToday={eventsToday.length}
      />

      {/* Vencendo em breve — destaque mobile */}
      <section aria-labelledby="due-soon-title">
        <SectionHeader
          id="due-soon-title"
          title="Vencendo em breve"
          count={dueSoonTasks.length}
          linkTo={dueSoonTasks.length > 0 ? '/tasks?filter=due_soon' : undefined}
        />
        {dueSoonTasks.length > 0 ? (
          <div className="space-y-2 md:hidden">
            {dueSoonTasks.map((t) => (
              <DeadlineCard
                key={`${t.id}-${t._occurrenceDate || 'base'}`}
                task={t}
                onClick={modals.openView}
              />
            ))}
          </div>
        ) : (
          <DueSoonEmpty />
        )}
        {dueSoonTasks.length > 0 && (
          <div className="hidden md:block space-y-2">
            <AnimatePresence>
              {dueSoonTasks.map((t) => (
                <TaskCard
                  key={`${t.id}-${t._occurrenceDate || 'base'}`}
                  task={t}
                  onClick={modals.openView}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {overdueTasks.length > 0 && (
        <section id="section-atrasadas" aria-labelledby="overdue-title">
          <SectionHeader
            title="Vencidas"
            count={overdueTasks.length}
            linkTo={overdueTasks.length > 5 ? '/tasks?filter=overdue' : undefined}
          />
          <div className="space-y-2">
            <AnimatePresence>
              {overdueTasks.slice(0, 5).map((t) => (
                <React.Fragment key={t.id}>
                  <div className="md:hidden">
                    <DeadlineCard task={t} onClick={modals.openView} />
                  </div>
                  <div className="hidden md:block">
                    <TaskCard task={t} onClick={modals.openView} onToggleComplete={handleToggleComplete} />
                  </div>
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {todayTasks.length > 0 && (
        <section id="section-hoje" aria-labelledby="today-title">
          <SectionHeader title="Hoje" count={todayTasks.length} linkTo="/tasks?filter=today" />
          <div className="space-y-2">
            <AnimatePresence>
              {todayTasks.map((t) => (
                <TaskCard
                  key={`${t.id}-${t._occurrenceDate || 'base'}`}
                  task={t}
                  onClick={modals.openView}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {eventsToday.length > 0 && (
        <section aria-labelledby="events-title">
          <SectionHeader title="Eventos de hoje" count={eventsToday.length} linkTo="/calendar" />
          <div className="space-y-2">
            <AnimatePresence>
              {eventsToday.map((t) => (
                <TaskCard
                  key={`${t.id}-${t._occurrenceDate || 'base'}`}
                  task={t}
                  onClick={modals.openView}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {recentDone.length > 0 && (
        <section id="section-concluidas" aria-labelledby="done-title">
          <SectionHeader title="Concluídas recentemente" count={recentDone.length} />
          <div className="space-y-2">
            <AnimatePresence>
              {recentDone.map((t) => (
                <TaskCard
                  key={`${t.id}-${t._occurrenceDate || 'done'}`}
                  task={t}
                  onClick={modals.openView}
                  onToggleComplete={handleToggleComplete}
                  compact
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {tasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa cadastrada"
          description="Crie a primeira tarefa ou importe registros pelo menu ⋮."
          actionLabel="Criar primeira tarefa"
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
