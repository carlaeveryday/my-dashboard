/* ============================================================
   utils.js — funciones pequeñas que usan todos los módulos.
   No guarda estado ni toca el DOM de ninguna herramienta.
   ============================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
export const DOW = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/** Identificador corto y único para cada registro. */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Date -> 'YYYY-MM-DD' en hora local (evita el desfase de toISOString). */
export const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** 'YYYY-MM-DD' -> Date local a las 00:00. */
export const parseDate = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Días enteros que faltan (negativo si ya pasó). */
export const daysLeft = (value) => Math.round((parseDate(value) - startOfToday()) / 86400000);

export const leftLabel = (n) => {
  if (n < 0) return `hace ${Math.abs(n)} d`;
  if (n === 0) return '¡hoy!';
  if (n === 1) return 'mañana';
  return `en ${n} días`;
};

/** Escapa texto del usuario antes de meterlo en innerHTML. */
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

/** Color de la barra según el tramo de la nota. */
export const gradeColor = (score) => {
  if (score < 5) return 'var(--grade-bad)';
  if (score < 7) return 'var(--grade-ok)';
  if (score < 8.5) return 'var(--grade-good)';
  return 'var(--grade-top)';
};

export const PRIORITY_RANK = { alta: 0, media: 1, baja: 2 };
