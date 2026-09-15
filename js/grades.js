/* ============================================================
   grades.js — notas de 0 a 10 con barra de progreso,
   filtros por asignatura, trimestre y mes, y media calculada
   sobre lo que se está viendo.
   ============================================================ */

import { $, MONTHS, uid, iso, escapeHtml, gradeColor } from './utils.js';
import { state, commit, onChange, getSubjects } from '../store.js';

/* ---------- Filtros ---------- */
const filtered = () => {
  const subject = $('#fSubject').value;
  const term = $('#fTerm').value;
  const month = $('#fMonth').value;

  return state.grades
    .filter((g) => (!subject || g.subject === subject)
      && (!term || g.term === term)
      && (!month || g.date.slice(5, 7) === month))
    .sort((a, b) => b.date.localeCompare(a.date));
};

const renderFilterOptions = () => {
  const subjects = getSubjects();
  const subjectSel = $('#fSubject');
  const keptSubject = subjectSel.value;
  subjectSel.innerHTML = '<option value="">Todas las asignaturas</option>'
    + subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  subjectSel.value = subjects.includes(keptSubject) ? keptSubject : '';

  const months = [...new Set(state.grades.map((g) => g.date.slice(5, 7)))].sort();
  const monthSel = $('#fMonth');
  const keptMonth = monthSel.value;
  monthSel.innerHTML = '<option value="">Todos los meses</option>'
    + months.map((m) => `<option value="${m}">${MONTHS[Number(m) - 1]}</option>`).join('');
  monthSel.value = months.includes(keptMonth) ? keptMonth : '';
};

/* ---------- Pintado ---------- */
const row = (g, { compact = false } = {}) => {
  const color = gradeColor(g.score);
  const meta = compact ? '' : `<div class="muted">
      ${escapeHtml(g.title || 'Prueba')} · ${g.term}º trimestre · ${MONTHS[Number(g.date.slice(5, 7)) - 1]}
      <button class="btn btn--link" data-del-grade="${g.id}" style="margin-left:8px">borrar</button>
    </div>`;

  return `<div class="grade">
    <div class="grade__top">
      <b>${escapeHtml(g.subject)}</b>
      <span class="grade__score" style="color:${color}">${g.score.toFixed(1)}/10</span>
    </div>
    ${meta}
    <div class="bar"><i style="width:${(g.score / 10) * 100}%;background:${color}"></i></div>
  </div>`;
};

const average = (list) => (list.length ? list.reduce((sum, g) => sum + g.score, 0) / list.length : null);

export const renderGrades = () => {
  renderFilterOptions();

  const list = filtered();
  $('#gradesList').innerHTML = list.length
    ? list.map((g) => row(g)).join('')
    : '<div class="empty">No hay notas con estos filtros. Añade una nota o quita algún filtro.</div>';

  const avg = average(list);
  const avgEl = $('#avgValue');
  avgEl.textContent = avg === null ? '—' : avg.toFixed(2);
  avgEl.style.color = avg === null ? 'var(--text)' : gradeColor(avg);

  const globalAvg = average(state.grades);
  $('#homeAvg').textContent = globalAvg === null ? 'sin notas' : `media global ${globalAvg.toFixed(2)}`;
  $('#homeGrades').innerHTML = state.grades.length
    ? [...state.grades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
        .map((g) => row(g, { compact: true })).join('')
    : '<div class="empty">Todavía no hay notas registradas.</div>';
};

/* ---------- Formulario ---------- */
const openForm = () => {
  $('#grSubject').value = '';
  $('#grTitle').value = '';
  $('#grScore').value = '';
  $('#grDate').value = iso(new Date());
  $('#gradeModal').classList.add('is-open');
  setTimeout(() => $('#grSubject').focus(), 40);
};

const saveGrade = () => {
  const subject = $('#grSubject').value.trim();
  const score = parseFloat($('#grScore').value);

  if (!subject) { $('#grSubject').focus(); return; }
  if (Number.isNaN(score) || score < 0 || score > 10) { $('#grScore').focus(); return; }

  state.grades.push({
    id: uid(),
    subject,
    title: $('#grTitle').value.trim(),
    score: Math.round(score * 10) / 10,
    term: $('#grTerm').value,
    date: $('#grDate').value || iso(new Date())
  });

  $('#gradeModal').classList.remove('is-open');
  commit();
};

/* ---------- Arranque del módulo ---------- */
export const initGrades = () => {
  $('#addGradeBtn').addEventListener('click', openForm);
  $('#saveGrade').addEventListener('click', saveGrade);

  ['#fSubject', '#fTerm', '#fMonth'].forEach((sel) =>
    $(sel).addEventListener('change', renderGrades));

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-del-grade]');
    if (!btn) return;
    state.grades = state.grades.filter((g) => g.id !== btn.dataset.delGrade);
    commit();
  });

  onChange(renderGrades);
};
