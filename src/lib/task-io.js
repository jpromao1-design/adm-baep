import * as XLSX from 'xlsx';
import { TYPE_LABELS } from './task-status';
import { getAuxiliar, normalizeSection, SECTIONS } from './sections';
import { getTaskDate } from './dates';

const TYPES = Object.keys(TYPE_LABELS);
const STATUSES = ['pendente', 'em_andamento', 'aguardando', 'concluido'];

const TYPE_FROM_LABEL = Object.fromEntries(
  Object.entries(TYPE_LABELS).flatMap(([k, v]) => [[v.toLowerCase(), k], [k, k]])
);

const STATUS_FROM_LABEL = {
  pendente: 'pendente',
  'em andamento': 'em_andamento',
  em_andamento: 'em_andamento',
  aguardando: 'aguardando',
  concluída: 'concluido',
  concluida: 'concluido',
  concluido: 'concluido',
};

const HEADERS = [
  'Título',
  'Tipo',
  'Status',
  'Seção',
  'Auxiliar',
  'Prazo',
  'Data evento',
  'Horário',
  'Local',
  'Descrição',
  'Observações',
];

function cellDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const y = parsed.y;
    const m = String(parsed.m).padStart(2, '0');
    const d = String(parsed.d).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function tasksToRows(tasks) {
  return tasks.map((t) => ({
    Título: t.title || '',
    Tipo: TYPE_LABELS[t.type] || t.type || '',
    Status: t.status || '',
    Seção: t.section || '',
    Auxiliar: getAuxiliar(t),
    Prazo: t.due_date || '',
    'Data evento': t.event_date || getTaskDate(t) || '',
    Horário: t.event_time || '',
    Local: t.location || '',
    Descrição: t.description || '',
    Observações: t.observations || '',
  }));
}

export function exportTasksCsv(tasks, filename = 'tarefas-adm-baep.csv') {
  const rows = tasksToRows(tasks);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const csv = XLSX.utils.sheet_to_csv(sheet);
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename);
}

export function exportTasksXlsx(tasks, filename = 'tarefas-adm-baep.xlsx') {
  const rows = tasksToRows(tasks);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Tarefas');
  XLSX.writeFile(wb, filename);
}

function pick(row, ...keys) {
  const map = {};
  Object.keys(row || {}).forEach((k) => {
    map[String(k).trim().toLowerCase()] = row[k];
  });
  for (const key of keys) {
    const found = map[key.toLowerCase()];
    if (found != null && found !== '') return found;
  }
  return '';
}

function normalizeType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'tarefa';
  const mapped = TYPE_FROM_LABEL[raw];
  if (mapped && TYPES.includes(mapped)) return mapped;
  return null;
}

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'pendente';
  const mapped = STATUS_FROM_LABEL[raw];
  if (mapped && STATUSES.includes(mapped)) return mapped;
  return null;
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function validateImportRows(rows) {
  const accepted = [];
  const errors = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const title = String(pick(row, 'título', 'titulo', 'title') || '').trim();
    if (!title) {
      errors.push(`Linha ${line}: título é obrigatório.`);
      return;
    }

    const type = normalizeType(pick(row, 'tipo', 'type'));
    if (!type) {
      errors.push(`Linha ${line}: tipo inválido (use Tarefa, Demanda, Evento ou Compromisso).`);
      return;
    }

    const status = normalizeStatus(pick(row, 'status'));
    if (!status) {
      errors.push(`Linha ${line}: status inválido.`);
      return;
    }

    const sectionRaw = pick(row, 'seção', 'secao', 'section');
    const section = sectionRaw ? normalizeSection(sectionRaw) : null;
    if (sectionRaw && !section) {
      errors.push(`Linha ${line}: seção inválida (use ${SECTIONS.join(', ')}).`);
      return;
    }

    const isEvent = type === 'evento' || type === 'compromisso';
    const due = cellDate(pick(row, 'prazo', 'due_date', 'vencimento'));
    const eventDate = cellDate(pick(row, 'data evento', 'event_date', 'data'));

    accepted.push({
      title,
      type,
      status,
      section,
      auxiliar: String(pick(row, 'auxiliar', 'envolvidos', 'involved') || '').trim() || null,
      due_date: isEvent ? null : due,
      event_date: isEvent ? eventDate || due : null,
      event_time: String(pick(row, 'horário', 'horario', 'event_time') || '').trim() || null,
      location: String(pick(row, 'local', 'location') || '').trim() || null,
      description: String(pick(row, 'descrição', 'descricao', 'description') || '').trim() || null,
      observations: String(pick(row, 'observações', 'observacoes', 'observations') || '').trim() || null,
    });
  });

  return { accepted, errors };
}
