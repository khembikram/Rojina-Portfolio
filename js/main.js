/* ==========================================================================
   Rojina — Portfolio interactions (GSAP + ScrollTrigger + Lenis + Three.js)
   ========================================================================== */

import {
  reduce, canHover, setupStatic, splitChars, setupLenis, scrollToTarget,
  setupTransitions, setupMenu, setupCursor, setupMagnetic, setupReveals,
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

/* ---------- Main ---------- */

async function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* Smooth scroll (paused until the intro finishes) */
  setupMenu(gsap);
  const lenis = setupLenis(gsap, ScrollTrigger);
  lenis?.stop();
  setupTransitions(gsap);

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
    setupHeroRipple(gsap, heroChars);
  });

  setupCursor(gsap);
  setupMagnetic(gsap);
  setupPointer();
  setupReveals(gsap);
  setupScroll(gsap, ScrollTrigger);
}

/* ---------- Hero letters rise towards the cursor ---------- */

function setupHeroRipple(gsap, chars) {
  if (!canHover || reduce) return;
  const hero = document.querySelector('.hero');
  const items = [...chars].map((el) => ({
    el,
    y: gsap.quickTo(el, 'yPercent', { duration: 0.8, ease: 'power3' }),
    r: gsap.quickTo(el, 'rotate', { duration: 0.8, ease: 'power3' }),
    cx: 0,
  }));
  const measure = () => items.forEach((it) => {
    const r = it.el.getBoundingClientRect();
    it.cx = r.left + r.width / 2;
  });
  measure();
  window.addEventListener('resize', measure);

  hero.addEventListener('pointermove', (e) => {
    const reach = innerWidth * 0.16;
    items.forEach((it) => {
      const d = e.clientX - it.cx;
      const lift = Math.max(0, 1 - Math.abs(d) / reach);
      const eased = lift * lift * (3 - 2 * lift);
      it.y(-eased * 14);
      it.r(eased * Math.sign(d) * -4);
    });
  });
  hero.addEventListener('pointerleave', () => items.forEach((it) => { it.y(0); it.r(0); }));
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

  /* Count-up stats */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    // The real number is in the HTML so it still shows without JS or motion
    el.textContent = '0';
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

  /* Marquee that speeds up with scroll velocity; project cards lean into the motion */
  const marquee = gsap.to('.marquee__track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
  const projects = gsap.utils.toArray('.work__track .project');
  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      scene?.kick(velocity);
      gsap.to(projects, {
        skewX: gsap.utils.clamp(-7, 7, velocity / -350),
        duration: 0.3,
        overwrite: true,
        onComplete: () => gsap.to(projects, { skewX: 0, duration: 0.9, ease: 'power3.out' }),
      });
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
