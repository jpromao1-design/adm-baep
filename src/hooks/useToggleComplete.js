import { updateTask } from '@/api/tasks';
import { queryClientInstance } from '@/lib/query-client';
import { isOccurrenceCompleted } from '@/lib/recurrence';
import { toast } from '@/components/ui/toaster';

export function useToggleComplete() {
  return async (task) => {
    try {
      if (task.is_recurring && task._occurrenceDate) {
        const current = Array.isArray(task.completed_occurrences) ? [...task.completed_occurrences] : [];
        const next = isOccurrenceCompleted(task, task._occurrenceDate)
          ? current.filter((d) => d !== task._occurrenceDate)
          : [...current, task._occurrenceDate];
        await updateTask(task.id, { completed_occurrences: next });
      } else {
        const status = task.status === 'concluido' ? 'pendente' : 'concluido';
        await updateTask(task.id, { status });
      }
      await queryClientInstance.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      toast({ title: 'Não foi possível atualizar', description: err.message, tone: 'danger' });
    }
  };
}
