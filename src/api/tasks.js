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

const TYPES = ['tarefa', 'demanda', 'evento', 'compromisso'];
const STATUSES = ['pendente', 'em_andamento', 'aguardando', 'concluido'];
const SECTIONS = ['P1', 'P3', 'P5'];

export function isDomOrEvent(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.preventDefault === 'function') return true;
  if (value.nativeEvent) return true;
  if (typeof Event !== 'undefined' && value instanceof Event) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  if (value.target && typeof HTMLElement !== 'undefined' && value.target instanceof HTMLElement) return true;
  return false;
}

function text(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return null;
  const next = String(value).trim();
  return next || null;
}

function flag(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

export function toTaskRow(input) {
  if (isDomOrEvent(input)) {
    throw new Error('Dados do formulário inválidos.');
  }
  if (!input || typeof input !== 'object') {
    throw new Error('Dados do formulário inválidos.');
  }

  const type = TYPES.includes(input.type) ? input.type : 'tarefa';
  const status = STATUSES.includes(input.status) ? input.status : 'pendente';
  const section = SECTIONS.includes(input.section) ? input.section : null;
  const title = text(input.title);
  if (!title) throw new Error('Título é obrigatório.');

  return {
    title,
    description: text(input.description),
    type,
    status,
    section,
    received_date: text(input.received_date),
    start_date: text(input.start_date),
    due_date: text(input.due_date),
    end_date: text(input.end_date),
    event_date: text(input.event_date),
    event_time: text(input.event_time),
    location: text(input.location),
    auxiliar: text(input.auxiliar ?? input.involved),
    notes: text(input.notes),
    observations: text(input.observations),
    remind_on_day: flag(input.remind_on_day, true),
    remind_day_before: flag(input.remind_day_before, true),
    is_recurring: flag(input.is_recurring, false),
    recurrence: text(input.recurrence),
    recurrence_end_date: text(input.recurrence_end_date),
  };
}

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

export async function createTask(input) {
  const row = toTaskRow(input);
  const { data: sessionData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      section: row.section,
      received_date: row.received_date,
      start_date: row.start_date,
      due_date: row.due_date,
      end_date: row.end_date,
      event_date: row.event_date,
      event_time: row.event_time,
      location: row.location,
      auxiliar: row.auxiliar,
      notes: row.notes,
      observations: row.observations,
      remind_on_day: row.remind_on_day,
      remind_day_before: row.remind_day_before,
      is_recurring: row.is_recurring,
      recurrence: row.is_recurring ? row.recurrence : null,
      recurrence_end_date: row.is_recurring ? row.recurrence_end_date : null,
      created_by: sessionData?.user?.id ?? null,
    })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRow(data);
}

export async function createTasks(payloads) {
  if (!payloads.length) return [];
  const { data: sessionData } = await supabase.auth.getUser();
  const uid = sessionData?.user?.id ?? null;
  const rows = payloads.map((item) => {
    const row = toTaskRow(item);
    return {
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      section: row.section,
      received_date: row.received_date,
      start_date: row.start_date,
      due_date: row.due_date,
      end_date: row.end_date,
      event_date: row.event_date,
      event_time: row.event_time,
      location: row.location,
      auxiliar: row.auxiliar,
      notes: row.notes,
      observations: row.observations,
      remind_on_day: row.remind_on_day,
      remind_day_before: row.remind_day_before,
      is_recurring: row.is_recurring,
      recurrence: row.is_recurring ? row.recurrence : null,
      recurrence_end_date: row.is_recurring ? row.recurrence_end_date : null,
      created_by: uid,
    };
  });
  const { data, error } = await supabase.from('tasks').insert(rows).select(TASK_COLUMNS);
  if (error) throw error;
  return (data || []).map(normalizeRow);
}

export async function updateTask(id, input) {
  if (typeof id !== 'string' || !id) throw new Error('Registro inválido.');
  if (isDomOrEvent(input)) throw new Error('Dados do formulário inválidos.');

  let patch;
  if (input && !Object.prototype.hasOwnProperty.call(input, 'title')) {
    patch = {};
    if (typeof input.status === 'string') patch.status = input.status;
    if (Array.isArray(input.completed_occurrences)) {
      patch.completed_occurrences = input.completed_occurrences.filter((item) => typeof item === 'string');
    }
    if (Object.keys(patch).length === 0) throw new Error('Dados do formulário inválidos.');
  } else {
    const row = toTaskRow(input);
    patch = {
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      section: row.section,
      received_date: row.received_date,
      start_date: row.start_date,
      due_date: row.due_date,
      end_date: row.end_date,
      event_date: row.event_date,
      event_time: row.event_time,
      location: row.location,
      auxiliar: row.auxiliar,
      notes: row.notes,
      observations: row.observations,
      remind_on_day: row.remind_on_day,
      remind_day_before: row.remind_day_before,
      is_recurring: row.is_recurring,
      recurrence: row.is_recurring ? row.recurrence : null,
      recurrence_end_date: row.is_recurring ? row.recurrence_end_date : null,
    };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
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
  return toTaskRow(form);
}
