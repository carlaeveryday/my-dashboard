/* ============================================================
   store.js — único sitio donde vive el estado.
   Guarda en localStorage (con respaldo en memoria si el
   navegador lo bloquea) y avisa a las herramientas cuando
   algo cambia, mediante suscripciones.
   ============================================================ */

import { uid, iso } from './utils.js';

const KEY = 'my_dashboard_carla_v1';

/* ---------- Capa de almacenamiento ---------- */
const storage = (() => {
  let memory = null;
  let available = false;

  try {
    const probe = '__probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch (_) {
    available = false; // modo privado, file:// restringido, cuota…
  }

  return {
    available,
    read() {
      if (!available) return memory;
      try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return memory;
      }
    },
    write(data) {
      memory = data;
      if (!available) return;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
      } catch (_) { /* si falla seguimos con la copia en memoria */ }
    }
  };
})();

/* ---------- Datos de ejemplo del primer arranque ---------- */
const seed = () => {
  const today = new Date();
  const year = today.getFullYear();
  const plus = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return iso(d);
  };

  return {
    theme: 'dark',
    pinned: false,
    events: [
      { id: uid(), title: 'Examen tema 4: la Restauración', subject: 'Historia', type: 'examen', date: plus(3), priority: 'alta', important: true },
      { id: uid(), title: 'Examen de cinemática', subject: 'Física y Química', type: 'examen', date: plus(6), priority: 'media', important: true },
      { id: uid(), title: 'Entregar comentario de texto', subject: 'Lengua Castellana', type: 'tarea', date: plus(1), priority: 'alta', important: true },
      { id: uid(), title: 'Excursión al museo', subject: 'Filosofía', type: 'evento', date: plus(12), priority: 'baja', important: false }
    ],
    grades: [
      { id: uid(), subject: 'Matemáticas I', title: 'Examen tema 1', score: 8.2, term: '1', date: `${year}-09-12` },
      { id: uid(), subject: 'Lengua Castellana', title: 'Comentario de texto', score: 7.9, term: '1', date: `${year}-09-20` },
      { id: uid(), subject: 'Filosofía', title: 'Trabajo sobre Platón', score: 9.1, term: '1', date: `${year}-10-02` },
      { id: uid(), subject: 'Física y Química', title: 'Prueba de formulación', score: 6.4, term: '1', date: `${year}-10-15` }
    ],
    todos: [
      { id: uid(), text: 'Repasar los temas 3 y 4 de Historia', done: false, priority: 'alta' },
      { id: uid(), text: 'Terminar los ejercicios de derivadas', done: false, priority: 'media' },
      { id: uid(), text: 'Pasar a limpio los apuntes de Filosofía', done: true, priority: 'baja' }
    ]
  };
};

/* ---------- Estado ---------- */
export const state = storage.read() || seed();

/* ---------- Suscripciones ---------- */
const listeners = new Set();

/** Registra una función de repintado. Devuelve la función para poder quitarla. */
export const onChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Repinta todo sin guardar (útil al arrancar o al cambiar de mes). */
export const refresh = () => listeners.forEach((fn) => fn());

/** Guarda en disco y repinta. Se llama tras cualquier modificación. */
export const commit = () => {
  storage.write(state);
  refresh();
};

/** Guarda sin repintar (preferencias como el tema o el menú fijado). */
export const persist = () => storage.write(state);

/* ---------- Consultas compartidas ---------- */
export const getSubjects = () => [...new Set([
  ...state.grades.map((g) => g.subject),
  ...state.events.map((e) => e.subject)
].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
