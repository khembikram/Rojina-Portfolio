/* ==========================================================================
   Rojina — Inner pages (work index + project case study)
   ========================================================================== */

import { reduce, setupStatic, setupLenis, setupCursor, setupMagnetic, setupReveals } from './common.js';
import { PROJECTS, FILTERS } from './projects.js';

const pad = (n) => String(n).padStart(2, '0');
const media = (p) => (p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : p.cover);

setupStatic();

const page = document.body.dataset.page;
const rendered = page === 'project' ? renderProject() : renderWork();

if (rendered && window.gsap && window.ScrollTrigger) init();

/* ---------- Work index ---------- */

function renderWork() {
  const grid = document.querySelector('[data-work-grid]');
  const filters = document.querySelector('[data-filters]');

  grid.innerHTML = PROJECTS.map((p, i) => `
    <article class="project" data-filter="${p.filter}" data-cursor="View" data-reveal>
      <a href="project.html?p=${p.slug}" class="project__link">
        <div class="project__media">${media(p)}</div>
        <div class="project__info">
          <span class="project__num">${pad(i + 1)}</span>
          <h2 class="project__title">${p.title}</h2>
          <span class="project__cat">${p.category} · ${p.year}</span>
        </div>
      </a>
    </article>`).join('');

  filters.innerHTML = FILTERS
    .filter((f) => f.key === 'all' || PROJECTS.some((p) => p.filter === f.key))
    .map((f) => `<button type="button" class="filter${f.key === 'all' ? ' is-active' : ''}" data-key="${f.key}" aria-pressed="${f.key === 'all'}">
      ${f.label}<sup>${pad(f.key === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.filter === f.key).length)}</sup>
    </button>`).join('');

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    filters.querySelectorAll('.filter').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    grid.querySelectorAll('.project').forEach((card) => {
      card.hidden = btn.dataset.key !== 'all' && card.dataset.filter !== btn.dataset.key;
    });
    window.ScrollTrigger?.refresh();
  });

  return true;
}

/* ---------- Project case study ---------- */

function renderProject() {
  const slug = new URLSearchParams(location.search).get('p');
  const index = PROJECTS.findIndex((p) => p.slug === slug);
  if (index === -1) {
    location.replace('work.html');
    return false;
  }
  const p = PROJECTS[index];
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  document.title = `${p.title} — Rojina`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.summary);

  const rows = [
    ['The challenge', p.challenge],
    ['The approach', p.approach],
    ['The outcome', p.outcome],
  ];

  document.querySelector('[data-project]').innerHTML = `
    <section class="page-hero">
      <div class="label" data-page-fade><span>(${pad(index + 1)})</span><span>${p.category}</span></div>
      <h1 class="page-title"><span class="line"><span>${p.title}</span></span></h1>
      <p class="page-hero__lead" data-page-fade>${p.summary}</p>
      <dl class="case-meta" data-page-fade>
        <div><dt>Client</dt><dd>${p.client}</dd></div>
        <div><dt>Role</dt><dd>${p.role}</dd></div>
        <div><dt>Year</dt><dd>${p.year}</dd></div>
        <div><dt>Services</dt><dd>${p.services.join(', ')}</dd></div>
      </dl>
    </section>

    <div class="case-media" data-page-fade>
      <div class="project__media">${media(p)}</div>
    </div>

    <section class="case-body section">
      ${rows.map(([head, text], i) => `
        <div class="case-row" data-reveal>
          <h2 class="case-row__head"><span>${pad(i + 1)}</span>${head}</h2>
          <p class="case-row__text">${text}</p>
        </div>`).join('')}
    </section>

    <a href="project.html?p=${next.slug}" class="case-next" data-cursor="Next">
      <span class="label"><span>Next project</span><span>${next.category}</span></span>
      <span class="case-next__title">${next.title} <i aria-hidden="true">→</i></span>
    </a>`;

  return true;
}

/* ---------- Motion ---------- */

function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  setupLenis(gsap, ScrollTrigger);
  setupCursor(gsap);
  setupMagnetic(gsap);

  if (!reduce) {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.page-title .line > span', { yPercent: 110, rotate: 2, duration: 1.6, stagger: 0.1 })
      .from('[data-page-fade]', { y: 30, autoAlpha: 0, duration: 1.3, stagger: 0.08 }, '<0.2')
      .from('.nav > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.06 }, '<');
  }

  setupReveals(gsap);
}
