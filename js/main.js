/* ============================================================
   main.js — lo común de la página: tema claro/oscuro, sidebar
   deslizante, navegación entre vistas, reloj y saludo, cierre
   de modales. Al final arranca cada herramienta.
   ============================================================ */

import { $, $$ } from './utils.js';
import { state, persist, refresh } from '../store.js';

import { initCalendar } from './calendar.js';
import { initEvents } from './events.js';
import { initGrades } from './grades.js';
import { initTodos } from './todos.js';
import { initLinks } from './links.js';

/* ---------- Tema ---------- */
const Theme = {
  apply() {
    document.documentElement.dataset.theme = state.theme;
    $('#themeToggle').setAttribute('aria-checked', String(state.theme === 'dark'));
  },
  toggle() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    this.apply();
    persist();
  },
  init() {
    this.apply();
    $('#themeToggle').addEventListener('click', () => this.toggle());
  }
};

/* ---------- Sidebar: se abre al pasar el ratón ---------- */
const Sidebar = {
  el: $('#sidebar'),
  closeTimer: null,

  open() {
    clearTimeout(this.closeTimer);
    this.el.classList.add('is-open');
  },

  close() {
    if (state.pinned) return;
    this.closeTimer = setTimeout(() => this.el.classList.remove('is-open'), 160);
  },

  setPinned(pinned) {
    state.pinned = pinned;
    const btn = $('#pinBtn');
    btn.classList.toggle('is-active', pinned);
    $('.sidebar__label', btn).textContent = pinned ? 'Soltar menú' : 'Fijar menú';
    if (pinned) this.open(); else this.close();
    persist();
  },

  init() {
    this.el.addEventListener('mouseenter', () => this.open());
    this.el.addEventListener('mouseleave', () => this.close());

    // Mismo comportamiento con teclado y en táctil.
    this.el.addEventListener('focusin', () => this.open());
    this.el.addEventListener('focusout', (ev) => {
      if (!this.el.contains(ev.relatedTarget)) this.close();
    });
    this.el.addEventListener('click', (ev) => {
      if (!this.el.classList.contains('is-open')) { this.open(); return; }
      if (ev.target.closest('#nav .nav-item') && !state.pinned && window.innerWidth < 760) {
        this.el.classList.remove('is-open');
      }
    });

    $('#pinBtn').addEventListener('click', () => this.setPinned(!state.pinned));
    if (state.pinned) this.setPinned(true);
  }
};

/* ---------- Navegación entre vistas ---------- */
const Nav = {
  init() {
    $('#nav').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.nav-item');
      if (!btn) return;
      $$('#nav .nav-item').forEach((b) => b.classList.toggle('is-active', b === btn));
      $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${btn.dataset.view}`));
    });
  }
};

/* ---------- Reloj y saludo ---------- */
const Clock = {
  tick() {
    const now = new Date();
    $('#clockTime').textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    $('#clockDate').textContent = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const h = now.getHours();
    const hello = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
    $('#greetText').textContent = `${hello}, Carla`;
  },
  init() {
    this.tick();
    setInterval(() => this.tick(), 20000);
  }
};

/* ---------- Modales (cerrar con fondo, botón o Escape) ---------- */
const Modals = {
  init() {
    $$('.modal').forEach((modal) => {
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal || ev.target.hasAttribute('data-close')) {
          modal.classList.remove('is-open');
        }
      });
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
    });
  }
};

/* ---------- Arranque ---------- */
Theme.init();
Sidebar.init();
Nav.init();
Clock.init();
Modals.init();

initCalendar();
initEvents();
initGrades();
initTodos();
initLinks();

refresh(); // primer pintado de todas las herramientas
