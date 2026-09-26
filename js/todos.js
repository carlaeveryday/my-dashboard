/* ============================================================
   todos.js — lista de tareas: marcar hechas, importancia por
   color y resumen en la pantalla de Inicio.
   ============================================================ */

import { $, escapeHtml, daysLeft, PRIORITY_RANK } from './utils.js';
import { state, onChange, addTodo, toggleTodo, deleteTodo } from './store.js';

const row = (t) => `<div class="todo${t.done ? ' is-done' : ''}" data-prio="${t.priority}">
  <button class="check" data-toggle="${t.id}" aria-label="Marcar como hecha" aria-pressed="${t.done}">
    <svg viewBox="0 0 24 24"><path d="m5 13 4 4 10-10"/></svg>
  </button>
  <span class="todo__text">${escapeHtml(t.text)}</span>
  <button class="btn btn--link" data-del-todo="${t.id}" aria-label="Eliminar tarea">✕</button>
</div>`;

/** Pendientes primero y, dentro, por importancia. */
const ordered = () => [...state.todos].sort((a, b) =>
  (a.done - b.done) || (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]));

export const renderTodos = () => {
  const all = ordered();
  const pending = all.filter((t) => !t.done);

  $('#todoList').innerHTML = all.length
    ? all.map(row).join('')
    : '<div class="empty">Lista vacía. Escribe arriba lo primero que tengas que hacer.</div>';

  $('#todoStats').textContent = `${pending.length} pendientes de ${state.todos.length}`;

  $('#homeTodos').innerHTML = pending.length
    ? pending.slice(0, 5).map(row).join('')
    : '<div class="empty">Nada pendiente. Disfruta el rato libre.</div>';

  const dates = state.events.filter((e) => e.important && daysLeft(e.date) >= 0).length;
  $('#pendingCount').textContent = `${pending.length} tareas y ${dates} fechas por delante`;
};

const submitTodo = () => {
  const input = $('#todoText');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  addTodo({ text, priority: $('#todoPrio').value });
  input.value = '';
  input.focus();
};

export const initTodos = () => {
  $('#addTodoBtn').addEventListener('click', submitTodo);
  $('#todoText').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') submitTodo();
  });

  document.addEventListener('click', (ev) => {
    const toggle = ev.target.closest('[data-toggle]');
    if (toggle) {
      toggleTodo(toggle.dataset.toggle);
      return;
    }

    const remove = ev.target.closest('[data-del-todo]');
    if (remove) {
      deleteTodo(remove.dataset.delTodo);
    }
  });

  onChange(renderTodos);
};
