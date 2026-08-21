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

const WRITE_FIELDS = [
  'title', 'description', 'type', 'status', 'section',
  'received_date', 'start_date', 'due_date', 'end_date',
  'event_date', 'event_time', 'event_datetime',
  'location', 'auxiliar', 'notes', 'observations',
  'remind_on_day', 'remind_day_before',
  'is_recurring', 'recurrence', 'recurrence_end_date', 'completed_occurrences',
];

function isPlainValue(value) {
  if (value == null) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (Array.isArray(value)) return value.every((item) => typeof item === 'string' || typeof item === 'number');
  return false;
}

export function stripMeta(form) {
  if (!form || typeof form !== 'object' || typeof form.preventDefault === 'function' || form.nativeEvent) {
    throw new Error('Dados do formulário inválidos.');
  }

  const data = {};
  for (const key of WRITE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(form, key)) continue;
    const value = form[key];
    if (!isPlainValue(value)) continue;
    data[key] = value === '' ? null : value;
  }

  data.auxiliar = String(form.auxiliar ?? form.involved ?? '').trim() || null;
  data.section = form.section || null;
  return data;
}
