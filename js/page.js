/* ==========================================================================
   Rojina — Inner pages (work, case study, about, contact)
   ========================================================================== */

import {
  CONFIG, reduce, setupStatic, setupLenis, setupTransitions, setupMenu, setupCursor, setupMagnetic, setupReveals,
} from './common.js';
import { PROJECTS, FILTERS } from './projects.js';

const pad = (n) => String(n).padStart(2, '0');
const media = (p) => (p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : p.cover);

setupStatic();

const page = document.body.dataset.page;
const renderers = { work: renderWork, project: renderProject };
const rendered = renderers[page] ? renderers[page]() : true;

if (page === 'contact') setupBrief();

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
    const show = [];
    grid.querySelectorAll('.project').forEach((card) => {
      card.hidden = btn.dataset.key !== 'all' && card.dataset.filter !== btn.dataset.key;
      if (!card.hidden) show.push(card);
    });
    if (window.gsap && !reduce) {
      window.gsap.fromTo(show, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out' });
    }
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

/* ---------- Contact: project brief → pre-filled email ---------- */

function setupBrief() {
  const form = document.querySelector('[data-brief]');
  const note = document.querySelector('[data-brief-note]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim();
    const email = data.get('email').trim();
    const message = data.get('message').trim();

    const missing = [...form.querySelectorAll('[required]')].find((field) => !field.value.trim() || !field.checkValidity());
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
    if (missing) {
      missing.closest('.field').classList.add('is-invalid');
      missing.focus();
      note.textContent = missing.type === 'email' ? 'Please check your email address.' : 'Please fill in your name, email and project details.';
      return;
    }

    const services = data.getAll('services');
    const body = [
      `Hi Rojina,`,
      ``,
      message,
      ``,
      `Interested in: ${services.length ? services.join(', ') : 'Not specified'}`,
      `Budget: ${data.get('budget') || 'Not specified'}`,
      ``,
      `${name}`,
      `${email}`,
    ].join('\n');
    const subject = `Project brief from ${name}`;
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = `Your email app should open now. If it doesn't, write to ${CONFIG.email}.`;
  });
}

/* ---------- Motion ---------- */

async function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const arriving = document.documentElement.classList.contains('is-arriving');

  setupMenu(gsap);
  setupLenis(gsap, ScrollTrigger);
  setupTransitions(gsap);
  setupCursor(gsap);
  setupMagnetic(gsap);

  const enter = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: arriving ? 0.6 : 0 });
  if (!reduce) {
    enter
      .from('.page-title .line > span', { yPercent: 110, rotate: 2, duration: 1.6, stagger: 0.1 })
      .from('[data-page-fade]', { y: 30, autoAlpha: 0, duration: 1.3, stagger: 0.08 }, '<0.2')
      .from('.nav > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.06 }, '<');
  }

  setupReveals(gsap);

  /* Run fn at `at` seconds into the entrance, or right away if that moment has passed */
  const onEnter = (fn, at) => {
    if (reduce || enter.progress() === 1 || enter.time() >= at) fn();
    else enter.add(fn, at);
  };

  if (page === 'about') setupAbout(gsap, onEnter);
  if (page === 'contact') setupContact(gsap, ScrollTrigger, onEnter);
}

/* ---------- About: particle portrait, stacking steps, toolkit ---------- */

function setupAbout(gsap, onEnter) {
  const holder = document.querySelector('[data-portrait]');
  import('./portrait.js')
    .then(({ createPortrait }) => createPortrait(holder, { src: 'assets/rojina.jpg', reduce }))
    .then((portrait) => {
      onEnter(() => portrait.assemble(), 0.3);
      if (reduce) return;
      gsap.to(portrait.uniforms.uScatter, {
        value: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.about-hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    })
    .catch((err) => console.warn('[portfolio] Particle portrait disabled:', err));

  if (reduce) return;

  /* Each step card shrinks back as the next one stacks on top */
  const steps = gsap.utils.toArray('.step');
  steps.forEach((step, i) => {
    const nextStep = steps[i + 1];
    if (!nextStep) return;
    gsap.to(step, {
      scale: 0.9,
      rotate: i % 2 ? 1.5 : -1.5,
      filter: 'brightness(0.75)',
      ease: 'none',
      scrollTrigger: { trigger: nextStep, start: 'top bottom', end: 'top 25%', scrub: true },
    });
  });

  /* Toolkit rows slide in opposite directions with scroll */
  gsap.utils.toArray('.tools__row').forEach((row) => {
    const dir = Number(row.dataset.dir);
    gsap.fromTo(row, { xPercent: dir > 0 ? -25 : 0 }, {
      xPercent: dir > 0 ? 0 : -25,
      ease: 'none',
      scrollTrigger: { trigger: '.tools', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ---------- Contact: 3D blob, animated FAQ ---------- */

function setupContact(gsap, ScrollTrigger, onEnter) {
  let scene = null;
  let current = 'hello';
  import('./scene.js')
    .then(({ createScene }) => createScene(document.querySelector('.webgl'), { reduce }))
    .then((s) => {
      scene = s;
      if (!scene) return;
      scene.go(current);
      onEnter(() => scene.intro(), 0.4);
      window.addEventListener('pointermove', (e) => {
        scene.pointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      }, { passive: true });
      ScrollTrigger.create({ onUpdate: (self) => scene.kick(self.getVelocity()) });
    })
    .catch((err) => console.warn('[portfolio] WebGL scene disabled:', err));

  document.querySelectorAll('[data-scene]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        current = section.dataset.scene;
        scene?.go(current);
      },
    });
  });

  /* FAQ: animate <details> open and closed instead of snapping */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const summary = item.querySelector('summary');
    const answer = item.querySelector('.faq__a');
    summary.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (item.open) {
        gsap.to(answer, {
          height: 0,
          autoAlpha: 0,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: () => { item.open = false; gsap.set(answer, { clearProps: 'all' }); ScrollTrigger.refresh(); },
        });
        item.classList.remove('is-open');
      } else {
        item.open = true;
        item.classList.add('is-open');
        gsap.from(answer, { height: 0, autoAlpha: 0, duration: 0.7, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
}
