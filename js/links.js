/* ============================================================
   links.js — accesos directos. Para añadir o quitar sitios
   solo hay que tocar la lista LINKS de aquí abajo.
   ============================================================ */

import { $ } from './utils.js';

export const LINKS = [
  { name: 'Google Classroom', url: 'https://classroom.google.com', color: '#0F9D58', short: 'GC' },
  { name: 'Gmail',            url: 'https://mail.google.com',      color: '#EA4335', short: 'M'  },
  { name: 'Google Docs',      url: 'https://docs.google.com',      color: '#4285F4', short: 'D'  },
  { name: 'Gemini',           url: 'https://gemini.google.com',    color: '#8B5CF6', short: 'G'  },
  { name: 'Google Drive',     url: 'https://drive.google.com',     color: '#FBBC04', short: 'Dr' },
  { name: 'Notion',           url: 'https://notion.so',            color: '#111827', short: 'N'  }
];

export const renderLinks = () => {
  $('#linksGrid').innerHTML = LINKS.map((link) =>
    `<a class="link" href="${link.url}" target="_blank" rel="noopener">
      <i style="background:${link.color}">${link.short}</i>${link.name}
    </a>`).join('');
};

export const initLinks = () => renderLinks();
