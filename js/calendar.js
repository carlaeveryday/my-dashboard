/* ============================================================
   calendar.js — rejilla del mes (vista Calendario y versión
   compacta de Inicio). Cuando se toca un día lanza el evento
   'calendar:day' para que events.js reaccione, de modo que
   los dos módulos no dependen uno del otro.
   ============================================================ */

import { $, $$, DOW, MONTHS, iso, escapeHtml, PRIORITY_RANK } from './utils.js';
import { state, onChange, refresh } from './store.js';

/** Mes que se está mostrando y día seleccionado, si lo hay. */
export const calendarState = {
  cursor: new Date(),
  selected: null
};

export const monthTitle = () =>
  `${MONTHS[calendarState.cursor.getMonth()]} ${calendarState.cursor.getFullYear()}`;

/** 42 días (6 semanas) empezando en lunes. */
const monthMatrix = (base) => {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const eventsOf = (key) => state.events
  .filter((e) => e.date === key)
  .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

const renderGrid = (selector, { compact = false } = {}) => {
  const el = $(selector);
  if (!el) return;

  const todayKey = iso(new Date());
  const maxChips = compact ? 1 : 3;

  const head = DOW.map((d) => `<div class="cal__dow">${d}</div>`).join('');

  const cells = monthMatrix(calendarState.cursor).map((date) => {
    const key = iso(date);
    const outside = date.getMonth() !== calendarState.cursor.getMonth();
    const items = eventsOf(key);

    const chips = items.slice(0, maxChips)
      .map((e) => `<span class="chip" data-prio="${e.priority}">${escapeHtml(e.subject || e.title)}</span>`)
      .join('');
    const more = items.length > maxChips
      ? `<span class="cal__more">+${items.length - maxChips} más</span>`
      : '';

    const classes = [
      'cal__day',
      outside ? 'is-out' : '',
      key === todayKey ? 'is-today' : '',
      key === calendarState.selected ? 'is-selected' : ''
    ].filter(Boolean).join(' ');

    return `<button class="${classes}" data-date="${key}">
      <span class="cal__num">${date.getDate()}</span>${chips}${more}
    </button>`;
  }).join('');

  el.innerHTML = head + cells;
};

export const renderCalendars = () => {
  renderGrid('#bigCal');
  renderGrid('#homeCal', { compact: true });
  const title = monthTitle();
  $$('#calTitle, #homeCalTitle').forEach((el) => { el.textContent = title; });
};

const shiftMonth = (n) => {
  const { cursor } = calendarState;
  calendarState.cursor = new Date(cursor.getFullYear(), cursor.getMonth() + n, 1);
  calendarState.selected = null;
  refresh();
};

export const initCalendar = () => {
  $('#calPrev').addEventListener('click', () => shiftMonth(-1));
  $('#calNext').addEventListener('click', () => shiftMonth(1));
  $('#homePrev').addEventListener('click', () => shiftMonth(-1));
  $('#homeNext').addEventListener('click', () => shiftMonth(1));
  $('#calToday').addEventListener('click', () => {
    calendarState.cursor = new Date();
    calendarState.selected = null;
    refresh();
  });

  // Delegación: un solo listener para las dos rejillas.
  document.addEventListener('click', (ev) => {
    const day = ev.target.closest('.cal__day');
    if (!day) return;

    const date = day.dataset.date;
    const fromHome = Boolean(day.closest('#homeCal'));
    calendarState.selected = calendarState.selected === date ? null : date;

    // Doble clic en la vista grande, o clic en el mini calendario: abrir formulario.
    const wantsForm = fromHome || ev.detail === 2;
    document.dispatchEvent(new CustomEvent('calendar:day', { detail: { date, wantsForm } }));
    renderCalendars();
  });

  onChange(renderCalendars);
};
