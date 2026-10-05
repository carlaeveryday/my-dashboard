/* ============================================================
   grades.js — notas de 0 a 10 con barra de progreso,
   filtros por asignatura, trimestre y mes, y media calculada
   sobre lo que se está viendo.
   ============================================================ */

import { $, MONTHS, iso, escapeHtml, gradeColor } from './utils.js';
import { state, onChange, getSubjects, addGrade, deleteGrade } from './store.js';

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

/* ---------- Gráficas de evolución (Chart.js) ---------- */
let avgChart = null;
let subjectChart = null;

const paletteColors = () => {
  const cs = getComputedStyle(document.documentElement);
  return {
    text: cs.getPropertyValue('--text-2').trim(),
    line: cs.getPropertyValue('--line').trim(),
    neon: cs.getPropertyValue('--neon').trim(),
    violet: cs.getPropertyValue('--violet-600').trim()
  };
};

/** Media de todas las asignaturas, agrupada por mes. */
const averageByMonth = () => {
  const byMonth = {};
  state.grades.forEach((g) => {
    const key = g.date.slice(0, 7); // 'YYYY-MM'
    (byMonth[key] ??= []).push(g.score);
  });
  const months = Object.keys(byMonth).sort();
  return {
    labels: months.map((m) => {
      const [y, mo] = m.split('-');
      return `${MONTHS[Number(mo) - 1].slice(0, 3)} ${y}`;
    }),
    data: months.map((m) => {
      const scores = byMonth[m];
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    })
  };
};

/** Notas de una asignatura concreta, en orden cronológico. */
const subjectSeries = (subject) => {
  const list = state.grades
    .filter((g) => g.subject === subject)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    labels: list.map((g) => `${g.date.slice(8, 10)}/${g.date.slice(5, 7)}`),
    data: list.map((g) => g.score)
  };
};

/** Crea la gráfica la primera vez; las siguientes solo actualiza sus datos. */
const upsertChart = (existing, canvasSelector, labels, data, color) => {
  const canvas = $(canvasSelector);
  if (!canvas || typeof Chart === 'undefined') return existing;

  const { text, line } = paletteColors();
  const dataset = {
    data,
    borderColor: color,
    backgroundColor: `${color}33`,
    fill: true,
    tension: 0.35,
    spanGaps: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: color
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 10, ticks: { stepSize: 2, color: text }, grid: { color: line } },
      x: { ticks: { color: text }, grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  if (existing) {
    existing.data.labels = labels;
    existing.data.datasets[0] = dataset;
    existing.options = options;
    existing.update();
    return existing;
  }
  return new Chart(canvas.getContext('2d'), { type: 'line', data: { labels, datasets: [dataset] }, options });
};

const renderSubjectSelect = () => {
  const sel = $('#chartSubject');
  if (!sel) return;
  const subs = getSubjects();
  const kept = sel.value;
  sel.innerHTML = subs.length
    ? subs.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')
    : '<option value="">Sin asignaturas todavía</option>';
  if (subs.includes(kept)) sel.value = kept;
};

const renderCharts = () => {
  const avg = averageByMonth();
  avgChart = upsertChart(avgChart, '#avgChart', avg.labels, avg.data, paletteColors().neon);

  renderSubjectSelect();
  const subject = $('#chartSubject')?.value;
  const series = subject ? subjectSeries(subject) : { labels: [], data: [] };
  subjectChart = upsertChart(subjectChart, '#subjectChart', series.labels, series.data, paletteColors().violet);
};

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

  renderCharts();
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

  addGrade({
    subject,
    title: $('#grTitle').value.trim(),
    score: Math.round(score * 10) / 10,
    term: $('#grTerm').value,
    date: $('#grDate').value || iso(new Date())
  });

  $('#gradeModal').classList.remove('is-open');
};

/* ---------- Arranque del módulo ---------- */
export const initGrades = () => {
  $('#addGradeBtn').addEventListener('click', openForm);
  $('#saveGrade').addEventListener('click', saveGrade);

  ['#fSubject', '#fTerm', '#fMonth'].forEach((sel) =>
    $(sel).addEventListener('change', renderGrades));

  $('#chartSubject').addEventListener('change', renderCharts);

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-del-grade]');
    if (!btn) return;
    deleteGrade(btn.dataset.delGrade);
  });

  onChange(renderGrades);
};