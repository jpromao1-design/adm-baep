import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTaskDate, parseDateOnly, toDateStr } from '@/lib/dates';
import { expandRecurringTasks } from '@/lib/recurrence';
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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { tasks, isLoading, handleSave, handleDelete, handleImport } = useTasks();
  const modals = useTaskModals();
  const handleToggleComplete = useToggleComplete();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const calendarStartStr = toDateStr(calendarStart);
  const calendarEndStr = toDateStr(calendarEnd);

  const tasksByDate = useMemo(() => {
    const expanded = expandRecurringTasks(tasks, parseDateOnly(calendarStartStr), parseDateOnly(calendarEndStr));
    const map = {};
    expanded.forEach((task) => {
      const dateKey = getTaskDate(task);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(task);
    });
    return map;
  }, [tasks, calendarStartStr, calendarEndStr]);

  const selectedDateStr = toDateStr(selectedDate);
  const selectedTasks = tasksByDate[selectedDateStr] || [];
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  if (isLoading) return <PageLoadingState />;

  return (
    <div className="page-container space-y-4">
      <PageHeader
        title="Agenda"
        subtitle="Calendário de compromissos e prazos"
        actions={
          <>
            <TaskIOBar tasks={selectedTasks.length ? selectedTasks : tasks} onImport={handleImport} />
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => modals.openNew({ due_date: selectedDateStr, event_date: selectedDateStr })}
            >
              Nova no dia
            </Button>
          </>
        }
      />

      <div className="bg-card rounded-2xl border border-border shadow-card p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="touch-target rounded-xl hover:bg-muted transition-colors focus-ring"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-base font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="touch-target rounded-xl hover:bg-muted transition-colors focus-ring"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dateStr = toDateStr(day);
            const dayTasks = tasksByDate[dateStr] || [];
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex flex-col items-center py-2 rounded-xl transition-all min-h-11 focus-ring',
                  !isCurrentMonth && 'opacity-35',
                  isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  today && !isSelected && 'bg-muted font-bold ring-1 ring-primary/20'
                )}
                aria-label={format(day, "dd 'de' MMMM", { locale: ptBR })}
                aria-pressed={isSelected}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-1" aria-hidden="true">
                    {dayTasks.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section aria-labelledby="day-tasks-title">
        <div className="flex items-center justify-between mb-3">
          <h3 id="day-tasks-title" className="section-title capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            {selectedTasks.length > 0 && (
              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                {selectedTasks.length}
              </span>
            )}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={() => modals.openNew({ due_date: selectedDateStr, event_date: selectedDateStr })}
          >
            Nova no dia
          </Button>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {selectedTasks.map((t, i) => (
              <TaskCard
                key={`${t.id}-${t._occurrenceDate || i}`}
                task={t}
                onClick={modals.openView}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </AnimatePresence>
          {selectedTasks.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum compromisso neste dia"
              description="Selecione outra data ou crie um novo registro para este dia."
              actionLabel="Nova no dia"
              onAction={() => modals.openNew({ due_date: selectedDateStr, event_date: selectedDateStr })}
            />
          )}
        </div>
      </section>

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
