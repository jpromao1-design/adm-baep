import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, createTasks, deleteTask, isDomOrEvent, listTasks, stripMeta, updateTask } from '@/api/tasks';
import { toast } from '@/components/ui/toaster';
import { STATUS_CONFIG } from '@/lib/task-status';

export function useTasks(limit = 500) {
  const queryClient = useQueryClient();
  const [statusBusyId, setStatusBusyId] = useState(null);

  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks(limit),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const createMutation = useMutation({
    mutationFn: (row) => createTask(row),
    onSuccess: invalidate,
    onError: (err) => toast({ title: 'Erro ao criar', description: err.message, tone: 'danger' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: invalidate,
    onError: (err) => toast({ title: 'Erro ao salvar', description: err.message, tone: 'danger' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidate,
    onError: (err) => toast({ title: 'Erro ao excluir', description: err.message, tone: 'danger' }),
  });

  const handleSave = async (form) => {
    if (isDomOrEvent(form)) {
      throw new Error('Dados do formulário inválidos.');
    }
    const data = stripMeta(form);
    if (typeof form?.id === 'string' && form.id) {
      await updateMutation.mutateAsync({ id: form.id, data });
      toast({ title: 'Tarefa atualizada', tone: 'success' });
    } else {
      await createMutation.mutateAsync(data);
      toast({ title: 'Tarefa criada', tone: 'success' });
    }
  };

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleImport = async (rows) => {
    await createTasks(rows.map((row) => stripMeta(row)));
    await invalidate();
  };

  const handleStatusChange = async (task, status) => {
    if (!task?.id || (task.is_recurring && task._occurrenceDate)) {
      toast({
        title: 'Status indisponível',
        description: 'Para ocorrências recorrentes, use concluir/reabrir no card.',
        tone: 'warning',
      });
      return;
    }
    if (task.status === status) return;
    if (statusBusyId === task.id) return;

    const label = STATUS_CONFIG[status]?.label || status;
    const previous = queryClient.getQueryData(['tasks']);
    setStatusBusyId(task.id);
    queryClient.setQueryData(['tasks'], (old) =>
      (old || []).map((row) =>
        row.id === task.id ? { ...row, status, updated_at: new Date().toISOString() } : row
      )
    );

    try {
      await updateTask(task.id, { status });
      toast({ title: `Status atualizado para ${label}.`, tone: 'success' });
      await invalidate();
    } catch (err) {
      queryClient.setQueryData(['tasks'], previous);
      toast({
        title: 'Não foi possível atualizar o status.',
        description: err?.message,
        tone: 'danger',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    statusBusyId,
    handleSave,
    handleDelete,
    handleImport,
    handleStatusChange,
  };
}
