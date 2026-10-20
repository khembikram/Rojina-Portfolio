/* ==========================================================================
   Rojina — Portfolio interactions (GSAP + ScrollTrigger + Lenis + Three.js)
   ========================================================================== */

import {
  reduce, setupStatic, setupLenis, scrollToTarget, setupCursor, setupMagnetic, setupReveals,
} from './common.js';

const THEMES = {
  light: { '--bg': '#EDEAE4', '--fg': '#0E0E0E' },
  dark: { '--bg': '#0E0E0E', '--fg': '#EDEAE4' },
};

const root = document.documentElement;
const body = document.body;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Three.js is loaded lazily so a CDN/WebGL failure never blocks the site */
let scene = null;
let currentScene = 'hero';
const scenePromise = import('./scene.js')
  .then(({ createScene }) => createScene(document.querySelector('.webgl'), { reduce }))
  .catch((err) => {
    console.warn('[portfolio] WebGL scene disabled:', err);
    return null;
  })
  .then((s) => {
    scene = s;
    scene?.go(currentScene);
    return s;
  });

setupStatic();

/* ---------- Bail out gracefully if GSAP didn't load ---------- */

if (!window.gsap || !window.ScrollTrigger) {
  document.querySelector('.loader')?.remove();
  body.classList.remove('is-loading');
} else {
  init();
}

/* ---------- Helpers ---------- */

function splitChars(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text]
    .map((c) => `<span class="char" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`)
    .join('');
  return el.querySelectorAll('.char');
}

function splitWords(el) {
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(' ');
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          frag.append(span);
        }
      });
    } else {
      node.classList.add('word');
      frag.append(node);
    }
  });
  el.textContent = '';
  el.append(frag);
  return el.querySelectorAll('.word');
}

/* ---------- Main ---------- */

async function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* Smooth scroll (paused until the intro finishes) */
  const lenis = setupLenis(gsap, ScrollTrigger);
  lenis?.stop();

  /* Loader counter runs while fonts + WebGL load */
  const num = document.querySelector('.loader__num');
  const counter = { v: 0 };
  const loading = gsap.timeline()
    .to(counter, {
      v: 100,
      duration: reduce ? 0.2 : 2,
      ease: 'power2.inOut',
      onUpdate: () => { num.textContent = Math.round(counter.v); },
    })
    .to('.loader__bar span', { scaleX: 1, duration: reduce ? 0.2 : 2, ease: 'power2.inOut' }, 0);

  await Promise.all([
    Promise.race([document.fonts.ready, wait(3000)]),
    Promise.race([scenePromise, wait(4000)]),
    loading.then(),
  ]);

  const heroChars = splitChars(document.querySelector('.hero__title .split'));

  /* Reveal sequence */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (reduce) {
    intro.to('.loader', { autoAlpha: 0, duration: 0.3 });
  } else {
    intro
      .to('.loader__inner', { y: -30, autoAlpha: 0, duration: 0.6, ease: 'power3.in' })
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, '-=0.15')
      .from(heroChars, { yPercent: 110, rotate: 4, duration: 1.6, stagger: 0.06 }, '-=0.55')
      .from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.1 }, '<0.2')
      .from('.nav > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.06 }, '<');
  }
  intro.add(() => scene?.intro(), reduce ? 0 : 1.2);
  intro.add(() => {
    document.querySelector('.loader')?.remove();
    body.classList.remove('is-loading');
    lenis?.start();
    ScrollTrigger.refresh();
    const dest = location.hash && document.querySelector(location.hash);
    if (dest) scrollToTarget(lenis, dest, true);
  });

  setupCursor(gsap);
  setupMagnetic(gsap);
  setupPointer();
  setupReveals(gsap);
  setupScroll(gsap, ScrollTrigger);
}

/* ---------- Pointer drives the 3D scene (mouse on desktop, touch drag on mobile) ---------- */

function setupPointer() {
  window.addEventListener('pointermove', (e) => {
    scene?.pointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  }, { passive: true });
}

/* ---------- Scroll choreography ---------- */

function setupScroll(gsap, ScrollTrigger) {
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  /* Background theme swaps for dark sections */
  const setTheme = (name) => {
    gsap.to(root, { ...THEMES[name], duration: reduce ? 0 : 0.8, ease: 'power2.out', overwrite: 'auto' });
    metaTheme?.setAttribute('content', THEMES[name]['--bg']);
    scene?.setTheme(name === 'dark');
  };
  document.querySelectorAll('[data-theme="dark"]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => setTheme(self.isActive ? 'dark' : 'light'),
    });
  });

  /* 3D blob choreography per section */
  document.querySelectorAll('[data-scene]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        currentScene = section.dataset.scene;
        scene?.go(currentScene);
      },
    });
  });

  if (reduce) return;

  /* Hero title drifts away as you scroll */
  gsap.to('.hero__title', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* About statement: words light up as you read */
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.12 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
  });

  /* Count-up stats */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });

  /* Services list */
  gsap.from('.service', {
    y: 60,
    autoAlpha: 0,
    duration: 1.2,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.services__list', start: 'top 85%' },
  });

  /* Work: pinned horizontal scroll on desktop, stacked on mobile */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    const track = document.querySelector('.work__track');
    const progress = document.querySelector('.work__progress span');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const horizontal = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin',
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
      },
    });

    gsap.utils.toArray('.project').forEach((project) => {
      const media = project.querySelector('.cover, img');
      if (!media) return;
      gsap.fromTo(media, { xPercent: 6 }, {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: project,
          containerAnimation: horizontal,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      });
    });
  });

  mm.add('(max-width: 899px)', () => {
    gsap.utils.toArray('.project').forEach((project) => {
      gsap.from(project, {
        y: 60,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: project, start: 'top 90%' },
      });
    });
  });

  /* Marquee that speeds up with scroll velocity */
  const marquee = gsap.to('.marquee__track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      scene?.kick(velocity);
      const boost = 1 + Math.min(Math.abs(velocity) / 250, 6);
      gsap.to(marquee, {
        timeScale: boost,
        duration: 0.2,
        overwrite: true,
        onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.2, ease: 'power2.out' }),
      });
    },
  });
}
