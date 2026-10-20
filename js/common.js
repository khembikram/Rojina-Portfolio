/* ==========================================================================
   Rojina — Shared interactions used by every page
   ========================================================================== */

export const CONFIG = {
  timeZone: 'Asia/Kathmandu',
  city: 'KTM',
};

export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Static bits that don't need GSAP ---------- */

export function setupStatic() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const timeEls = document.querySelectorAll('[data-time]');
  const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.timeZone });
  const tickClock = () => {
    const t = `${CONFIG.city} ${timeFmt.format(new Date())}`;
    timeEls.forEach((el) => { el.textContent = t; });
  };
  tickClock();
  setInterval(tickClock, 10000);
}

/* ---------- Smooth scroll + in-page anchors ---------- */

export function setupLenis(gsap, ScrollTrigger) {
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const dest = id === '#top' ? 0 : document.querySelector(id);
      if (dest === null) return;
      e.preventDefault();
      scrollToTarget(lenis, dest);
    });
  });

  return lenis;
}

export function scrollToTarget(lenis, dest, immediate = false) {
  if (lenis) {
    lenis.scrollTo(dest, immediate ? { immediate: true } : { duration: 1.6 });
  } else {
    const top = dest === 0 ? 0 : dest.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reduce || immediate ? 'auto' : 'smooth' });
  }
}

/* ---------- Cursor ---------- */

export function setupCursor(gsap) {
  if (!canHover) return;
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');
  document.body.classList.add('has-cursor');

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    cursor.classList.remove('is-hidden');
  });

  document.addEventListener('pointerover', (e) => {
    const view = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, .service');
    cursor.classList.toggle('is-view', !!view);
    cursor.classList.toggle('is-hover', !view && !!link);
    if (view) label.textContent = view.dataset.cursor;
  });

  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
}

/* ---------- Magnetic buttons ---------- */

export function setupMagnetic(gsap) {
  if (!canHover || reduce) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.35)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.35)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- Scroll reveals shared by all pages ---------- */

export function setupReveals(gsap) {
  if (reduce) return;

  /* Generic fade-up reveals */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  /* Masked line reveals for titles */
  gsap.utils.toArray('.section-title, .contact__title').forEach((title) => {
    gsap.from(title.querySelectorAll('.line > span'), {
      yPercent: 110,
      duration: 1.4,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: title, start: 'top 85%' },
    });
  });

  /* Image parallax inside a clipped frame */
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* Contact button pop */
  if (document.querySelector('.contact__btn')) {
    gsap.from('.contact__btn', {
      scale: 0,
      rotate: -45,
      duration: 1.4,
      ease: 'elastic.out(1, 0.5)',
      scrollTrigger: { trigger: '.contact__main', start: 'top 75%' },
    });
  }
}
