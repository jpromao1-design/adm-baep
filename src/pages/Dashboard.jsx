import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { addDays, startOfDay } from 'date-fns';
import { ListTodo, Plus } from 'lucide-react';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { NotificationBanner } from '@/components/dashboard/NotificationBanner';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { TaskCard } from '@/components/tasks/TaskCard';
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
import { checkAndNotifyTasks, requestNotificationPermission } from '@/lib/notifications';
import { expandRecurringTasks, isOccurrenceCompleted } from '@/lib/recurrence';
import { getTaskDate, toDateStr, todayStr, formatDateLong } from '@/lib/dates';
import { isOverdue } from '@/lib/task-status';

function DashboardSection({ id, title, count, tone = 'default', linkTo, children }) {
  const titleClass =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'info'
          ? 'text-info'
          : 'text-foreground';

  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 id={`${id}-title`} className={`section-title ${titleClass}`}>
            {title}
          </h2>
          <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-primary font-semibold hover:underline focus-ring rounded">
            Ver todas →
          </Link>
        )}
      </div>
      <div className="space-y-2">
        <AnimatePresence>{children}</AnimatePresence>
      </div>
    </section>
  );
}

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
    <div className="page-container space-y-6">
      <PageHeader
        title="Início"
        subtitle={dateLabel}
        actions={
          <>
            <TaskIOBar tasks={tasks} onImport={handleImport} />
            <NotificationBell tasks={tasks} />
            <Button className="hidden md:inline-flex" onClick={() => modals.openNew()}>
              <Plus className="w-4 h-4" /> Nova Tarefa
            </Button>
          </>
        }
      />

      <NotificationBanner
        overdueCount={overdueTasks.length}
        dueTodayCount={todayTasks.length}
        eventsToday={eventsToday.length}
      />
      <StatsRow counts={counts} />

      {overdueTasks.length > 0 && (
        <DashboardSection
          id="section-atrasadas"
          title="Vencidas"
          count={overdueTasks.length}
          tone="danger"
          linkTo={overdueTasks.length > 5 ? '/tasks?filter=overdue' : undefined}
        >
          {overdueTasks.slice(0, 5).map((t) => (
            <TaskCard key={t.id} task={t} onClick={modals.openView} onToggleComplete={handleToggleComplete} />
          ))}
        </DashboardSection>
      )}

      {todayTasks.length > 0 && (
        <DashboardSection id="section-hoje" title="Hoje" count={todayTasks.length} linkTo="/tasks?filter=today">
          {todayTasks.map((t) => (
            <TaskCard
              key={`${t.id}-${t._occurrenceDate || 'base'}`}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </DashboardSection>
      )}

      {dueSoonTasks.length > 0 && (
        <DashboardSection
          id="section-andamento"
          title="Vencendo em breve"
          count={dueSoonTasks.length}
          tone="warning"
          linkTo="/tasks?filter=due_soon"
        >
          {dueSoonTasks.map((t) => (
            <TaskCard
              key={`${t.id}-${t._occurrenceDate || 'base'}`}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </DashboardSection>
      )}

      {eventsToday.length > 0 && (
        <DashboardSection title="Eventos de hoje" count={eventsToday.length} tone="info" linkTo="/calendar">
          {eventsToday.map((t) => (
            <TaskCard
              key={`${t.id}-${t._occurrenceDate || 'base'}`}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </DashboardSection>
      )}

      {recentDone.length > 0 && (
        <DashboardSection id="section-concluidas" title="Concluídas recentemente" count={recentDone.length}>
          {recentDone.map((t) => (
            <TaskCard
              key={`${t.id}-${t._occurrenceDate || 'done'}`}
              task={t}
              onClick={modals.openView}
              onToggleComplete={handleToggleComplete}
              compact
            />
          ))}
        </DashboardSection>
      )}

      {tasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa cadastrada"
          description="Crie a primeira tarefa ou importe registros de uma planilha Excel/CSV."
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
