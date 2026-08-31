import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, createTasks, deleteTask, isDomOrEvent, listTasks, stripMeta, updateTask } from '@/api/tasks';
import { toast } from '@/components/ui/toaster';

export function useTasks(limit = 500) {
  const queryClient = useQueryClient();

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
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleImport = async (rows) => {
    await createTasks(rows.map((row) => stripMeta(row)));
    await invalidate();
  };

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    handleSave,
    handleDelete,
    handleImport,
  };
}
