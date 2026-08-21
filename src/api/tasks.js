import { supabase } from './supabaseClient';

const TASK_COLUMNS = [
  'id', 'title', 'description', 'type', 'status', 'section',
  'received_date', 'start_date', 'due_date', 'end_date',
  'event_date', 'event_time', 'event_datetime',
  'location', 'auxiliar', 'notes', 'observations',
  'remind_on_day', 'remind_day_before',
  'is_recurring', 'recurrence', 'recurrence_end_date', 'completed_occurrences',
  'created_by', 'created_at', 'updated_at',
].join(', ');

function normalizeRow(row) {
  if (!row) return row;
  return {
    ...row,
    auxiliar: row.auxiliar ?? row.involved ?? null,
  };
}

export async function listTasks(limit = 500) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(normalizeRow);
}

export async function createTask(payload) {
  const { data: sessionData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, created_by: sessionData?.user?.id ?? null })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRow(data);
}

export async function createTasks(payloads) {
  if (!payloads.length) return [];
  const { data: sessionData } = await supabase.auth.getUser();
  const uid = sessionData?.user?.id ?? null;
  const { data, error } = await supabase
    .from('tasks')
    .insert(payloads.map((p) => ({ ...p, created_by: uid })))
    .select(TASK_COLUMNS);
  if (error) throw error;
  return (data || []).map(normalizeRow);
}

export async function updateTask(id, payload) {
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRow(data);
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export function stripMeta(form) {
  const {
    id,
    created_at,
    updated_at,
    created_by,
    created_date,
    updated_date,
    _occurrenceDate,
    priority,
    involved,
    ...data
  } = form;
  data.auxiliar = (form.auxiliar ?? involved ?? '').toString().trim() || null;
  data.section = form.section || null;
  delete data.priority;
  delete data.involved;
  return data;
}
