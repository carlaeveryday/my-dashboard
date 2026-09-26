/* ============================================================
   store.js — único sitio donde vive el estado y donde se habla
   con Supabase. Cada herramienta llama a una función de aquí
   (addEvent, deleteGrade, toggleTodo…) en vez de tocar el
   estado directamente: así el cambio se pinta al instante
   (optimista) y se guarda en la base de datos por detrás.
   ============================================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';
import { uid } from './utils.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Estado en memoria (espejo de la base de datos) ---------- */
export const state = {
  theme: 'dark',
  pinned: false,
  events: [],
  grades: [],
  todos: [],
  ready: false // se pone a true cuando ha llegado la primera carga
};

/* ---------- Suscripciones para repintar ---------- */
const listeners = new Set();
export const onChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const refresh = () => listeners.forEach((fn) => fn());

const warn = (accion, error) => {
  if (error) console.error(`Supabase: no se pudo ${accion}`, error);
};

/* ---------- Carga inicial ---------- */
export const loadAll = async () => {
  const [settingsRes, eventsRes, gradesRes, todosRes] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('events').select('*').order('date'),
    supabase.from('grades').select('*').order('date', { ascending: false }),
    supabase.from('todos').select('*').order('created_at')
  ]);

  if (settingsRes.data) {
    state.theme = settingsRes.data.theme ?? 'dark';
    state.pinned = settingsRes.data.pinned ?? false;
  }
  state.events = eventsRes.data ?? [];
  state.grades = gradesRes.data ?? [];
  state.todos = todosRes.data ?? [];
  state.ready = true;

  warn('cargar los ajustes', settingsRes.error);
  warn('cargar los eventos', eventsRes.error);
  warn('cargar las notas', gradesRes.error);
  warn('cargar las tareas', todosRes.error);

  refresh();
};

/* ---------- Ajustes: tema y menú fijado ---------- */
export const setTheme = (theme) => {
  state.theme = theme;
  refresh();
  supabase.from('settings').upsert({ id: 1, theme, pinned: state.pinned })
    .then(({ error }) => warn('guardar el tema', error));
};

export const setPinned = (pinned) => {
  state.pinned = pinned;
  refresh();
  supabase.from('settings').upsert({ id: 1, theme: state.theme, pinned })
    .then(({ error }) => warn('guardar el menú fijado', error));
};

/* ---------- Eventos (exámenes, tareas, eventos con fecha) ---------- */
export const addEvent = (event) => {
  const row = { id: uid(), ...event };
  state.events.push(row);
  refresh();
  supabase.from('events').insert(row).then(({ error }) => warn('guardar el evento', error));
};

export const deleteEvent = (id) => {
  state.events = state.events.filter((e) => e.id !== id);
  refresh();
  supabase.from('events').delete().eq('id', id).then(({ error }) => warn('borrar el evento', error));
};

/* ---------- Notas ---------- */
export const addGrade = (grade) => {
  const row = { id: uid(), ...grade };
  state.grades.push(row);
  refresh();
  supabase.from('grades').insert(row).then(({ error }) => warn('guardar la nota', error));
};

export const deleteGrade = (id) => {
  state.grades = state.grades.filter((g) => g.id !== id);
  refresh();
  supabase.from('grades').delete().eq('id', id).then(({ error }) => warn('borrar la nota', error));
};

/* ---------- Tareas ---------- */
export const addTodo = (todo) => {
  const row = { id: uid(), done: false, ...todo };
  state.todos.push(row);
  refresh();
  supabase.from('todos').insert(row).then(({ error }) => warn('guardar la tarea', error));
};

export const toggleTodo = (id) => {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  refresh();
  supabase.from('todos').update({ done: todo.done }).eq('id', id)
    .then(({ error }) => warn('actualizar la tarea', error));
};

export const deleteTodo = (id) => {
  state.todos = state.todos.filter((t) => t.id !== id);
  refresh();
  supabase.from('todos').delete().eq('id', id).then(({ error }) => warn('borrar la tarea', error));
};

/* ---------- Consultas compartidas ---------- */
export const getSubjects = () => [...new Set([
  ...state.grades.map((g) => g.subject),
  ...state.events.map((e) => e.subject)
].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
