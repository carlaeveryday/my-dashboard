/* ============================================================
   events.js — exámenes, tareas y eventos del calendario:
   panel de próximos importantes, agenda del día o del mes,
   y el formulario para crearlos o borrarlos.
   ============================================================ */

import { $, MONTHS, uid, iso, parseDate, daysLeft, leftLabel, escapeHtml } from './utils.js';
import { state, commit, onChange, getSubjects } from './store.js';
import { calendarState, monthTitle } from './calendar.js';

/* ---------- Pintado ---------- */
const card = (e) => {
  const date = parseDate(e.date);
  return `<article class="up" data-prio="${e.priority}">
    <div class="up__date">
      <b>${date.getDate()}</b>
      <small>${MONTHS[date.getMonth()].slice(0, 3)}</small>
    </div>
    <div class="up__body">
      <strong>${escapeHtml(e.title)}</strong>
      <span>${escapeHtml(e.subject || 'Sin asignatura')} · <span class="tag">${e.type}</span></span>
    </div>
    <div class="up__left">${leftLabel(daysLeft(e.date))}</div>
    <button class="btn btn--link" data-del-event="${e.id}" aria-label="Eliminar evento">✕</button>
  </article>`;
};

const renderUpcoming = () => {
  const list = state.events
    .filter((e) => e.important && daysLeft(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  $('#upcomingList').innerHTML = list.length
    ? list.map(card).join('')
    : '<div class="empty">Aquí aparecen los exámenes y entregas que marques como importantes. Añade el primero.</div>';
};

const renderAgenda = () => {
  const { selected, cursor } = calendarState;

  const sameMonth = (e) => {
    const d = parseDate(e.date);
    return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
  };

  const list = state.events
    .filter((e) => (selected ? e.date === selected : sameMonth(e)))
    .sort((a, b) => a.date.localeCompare(b.date));

  $('#dayTitle').textContent = selected
    ? `Día ${parseDate(selected).getDate()} de ${MONTHS[parseDate(selected).getMonth()]}`
    : `Agenda de ${monthTitle()}`;

  $('#agendaList').innerHTML = list.length
    ? `<div class="upcoming">${list.map(card).join('')}</div>`
    : '<div class="empty">No hay nada apuntado todavía. Pulsa “Nuevo” para añadir un examen, una tarea o un evento.</div>';
};

/** Rellena el desplegable de asignaturas compartido por los dos formularios. */
const renderSubjectList = () => {
  $('#subjectList').innerHTML = getSubjects()
    .map((s) => `<option value="${escapeHtml(s)}">`).join('');
};

export const renderEvents = () => {
  renderUpcoming();
  renderAgenda();
  renderSubjectList();
};

/* ---------- Formulario ---------- */
const openForm = (date = iso(new Date())) => {
  $('#evTitle').value = '';
  $('#evSubject').value = '';
  $('#evType').value = 'examen';
  $('#evDate').value = date;
  $('#evPrio').value = 'media';
  $('#evImportant').checked = true;
  $('#eventModal').classList.add('is-open');
  setTimeout(() => $('#evTitle').focus(), 40);
};

const saveEvent = () => {
  const title = $('#evTitle').value.trim();
  const date = $('#evDate').value;

  if (!title || !date) {
    $('#evTitle').placeholder = 'Ponle un título para poder guardarlo';
    $('#evTitle').focus();
    return;
  }

  state.events.push({
    id: uid(),
    title,
    subject: $('#evSubject').value.trim(),
    type: $('#evType').value,
    date,
    priority: $('#evPrio').value,
    important: $('#evImportant').checked
  });

  $('#eventModal').classList.remove('is-open');
  commit();
};

/* ---------- Arranque del módulo ---------- */
export const initEvents = () => {
  $('#addEventBtn').addEventListener('click', () => openForm(calendarState.selected || undefined));
  $('#addFromHome').addEventListener('click', () => openForm());
  $('#saveEvent').addEventListener('click', saveEvent);

  // El calendario avisa de qué día se ha tocado.
  document.addEventListener('calendar:day', (ev) => {
    renderAgenda();
    if (ev.detail.wantsForm) openForm(ev.detail.date);
  });

  // Borrado desde cualquier lista de eventos.
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-del-event]');
    if (!btn) return;
    state.events = state.events.filter((e) => e.id !== btn.dataset.delEvent);
    commit();
  });

  onChange(renderEvents);
};
