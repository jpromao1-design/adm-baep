import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { addDays, startOfDay } from 'date-fns';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { NotificationBanner } from '@/components/dashboard/NotificationBanner';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { useTasks } from '@/hooks/useTasks';
import { useTaskModals } from '@/hooks/useTaskModals';
import { useToggleComplete } from '@/hooks/useToggleComplete';
import { checkAndNotifyTasks, requestNotificationPermission } from '@/lib/notifications';
import { expandRecurringTasks, isOccurrenceCompleted } from '@/lib/recurrence';
import { getTaskDate, toDateStr, todayStr } from '@/lib/dates';
import { isOverdue } from '@/lib/task-status';
import { Plus } from 'lucide-react';

function DashboardSection({ id, title, count, accent, children }) {
  return (
    <div id={id}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-sm font-bold ${accent || 'text-foreground'}`}>{title}</h2>
        <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>{children}</AnimatePresence>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { tasks, isLoading, handleSave, handleDelete } = useTasks();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70dvh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell tasks={tasks} />
          <button
            type="button"
            onClick={modals.openNew}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      <NotificationBanner
        overdueCount={overdueTasks.length}
        dueTodayCount={todayTasks.length}
        eventsToday={eventsToday.length}
      />
      <StatsRow counts={counts} />

      {todayTasks.length > 0 && (
        <DashboardSection id="section-hoje" title="Hoje" count={todayTasks.length}>
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
      {overdueTasks.length > 0 && (
        <DashboardSection id="section-atrasadas" title="Atrasadas" count={overdueTasks.length} accent="text-red-600">
          {overdueTasks.slice(0, 5).map((t) => (
            <TaskCard key={t.id} task={t} onClick={modals.openView} onToggleComplete={handleToggleComplete} />
          ))}
          {overdueTasks.length > 5 && (
            <Link to="/tasks?filter=overdue" className="text-xs text-primary font-medium hover:underline">
              Ver todas →
            </Link>
          )}
        </DashboardSection>
      )}
      {dueSoonTasks.length > 0 && (
        <DashboardSection id="section-andamento" title="Vencendo em breve" count={dueSoonTasks.length} accent="text-amber-600">
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
        <DashboardSection title="Eventos de hoje" count={eventsToday.length} accent="text-blue-600">
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
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Nenhuma tarefa ainda.</p>
          <button
            type="button"
            onClick={modals.openNew}
            className="mt-4 px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold active:scale-[0.97] transition-all"
          >
            Criar primeira tarefa
          </button>
        </div>
      )}

      <TaskViewModal open={modals.viewModalOpen} onClose={modals.closeView} task={modals.selectedTask} onEdit={modals.openEdit} onDelete={handleDelete} />
      <TaskFormModal open={modals.modalOpen} onClose={modals.closeForm} task={modals.selectedTask} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}
