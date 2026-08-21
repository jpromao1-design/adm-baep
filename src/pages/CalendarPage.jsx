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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTaskDate, parseDateOnly, toDateStr } from '@/lib/dates';
import { expandRecurringTasks } from '@/lib/recurrence';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskIOBar } from '@/components/tasks/TaskIOBar';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70dvh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Agenda</h1>
        <div className="flex items-center gap-2">
          <TaskIOBar tasks={selectedTasks.length ? selectedTasks : tasks} onImport={handleImport} />
          <button
            type="button"
            onClick={() => modals.openNew({ due_date: selectedDateStr, event_date: selectedDateStr })}
            className="text-sm font-semibold text-primary min-h-11 px-2"
          >
            Nova no dia
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-accent transition-colors min-h-11 min-w-11">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-base font-bold text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-accent transition-colors min-h-11 min-w-11">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
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
                  'relative flex flex-col items-center py-2 rounded-xl transition-all duration-150 min-h-11',
                  !isCurrentMonth && 'opacity-30',
                  isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  today && !isSelected && 'bg-accent font-bold'
                )}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayTasks.slice(0, 3).map((_, i) => (
                      <span key={i} className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 capitalize">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          {selectedTasks.length > 0 && (
            <span className="ml-2 bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              {selectedTasks.length}
            </span>
          )}
        </h3>
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
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum compromisso neste dia.</p>
          )}
        </div>
      </div>

      <TaskViewModal open={modals.viewModalOpen} onClose={modals.closeView} task={modals.selectedTask} onEdit={modals.openEdit} onDelete={handleDelete} />
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
