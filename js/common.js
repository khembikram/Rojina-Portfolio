/* ==========================================================================
   Rojina — Shared interactions used by every page
   ========================================================================== */

export const CONFIG = {
  timeZone: 'Asia/Kathmandu',
  city: 'KTM',
  email: 'chhetrirojina247@gmail.com',
};

export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Names shown on the page-transition curtain */
const PAGE_NAMES = {
  '': 'Home',
  'index.html': 'Home',
  'work.html': 'Work',
  'project.html': 'Case study',
  'about.html': 'About',
  'contact.html': 'Contact',
};

const store = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* private mode */ } },
  remove(key) { try { sessionStorage.removeItem(key); } catch { /* private mode */ } },
};

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

  // Without GSAP there is no curtain animation, so never leave it covering the page
  if (!window.gsap) document.documentElement.classList.remove('is-arriving');
}

/* ---------- Text splitting ---------- */

export function splitChars(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text]
    .map((c) => `<span class="char" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`)
    .join('');
  return el.querySelectorAll('.char');
}

export function splitWords(el) {
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

/* ---------- Smooth scroll + in-page anchors ---------- */

let lenisInstance = null;

export function setupLenis(gsap, ScrollTrigger) {
  if (!reduce && typeof window.Lenis === 'function') {
    lenisInstance = new window.Lenis({ lerp: 0.09 });
    lenisInstance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const dest = id === '#top' ? 0 : document.querySelector(id);
      if (dest === null) return;
      e.preventDefault();
      scrollToTarget(lenisInstance, dest);
    });
  });

  return lenisInstance;
}

export function scrollToTarget(lenis, dest, immediate = false) {
  if (lenis) {
    lenis.scrollTo(dest, immediate ? { immediate: true } : { duration: 1.6 });
  } else {
    const top = dest === 0 ? 0 : dest.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reduce || immediate ? 'auto' : 'smooth' });
  }
}

/* ---------- Page transitions (curtain wipe between pages) ---------- */

const pageKey = (url) => url.pathname.split('/').pop();

export function setupTransitions(gsap) {
  const curtain = document.querySelector('.transition');
  if (!curtain) return;
  const label = curtain.querySelector('.transition__label');
  const html = document.documentElement;
  const hidden = 'inset(100% 0% 0% 0%)';
  const covered = 'inset(0% 0% 0% 0%)';
  const gone = 'inset(0% 0% 100% 0%)';

  /* Arriving: lift the curtain (the home page has its own loader instead) */
  const arriving = store.get('pt');
  store.remove('pt');
  if (arriving && html.classList.contains('is-arriving') && !document.querySelector('.loader')) {
    label.textContent = arriving;
    gsap.set(curtain, { clipPath: covered });
    html.classList.remove('is-arriving');
    gsap.timeline({ delay: 0.15 })
      .to(label, { yPercent: -100, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
      .to(curtain, { clipPath: gone, duration: reduce ? 0.01 : 1, ease: 'expo.inOut' }, '-=0.2')
      .set(curtain, { clipPath: hidden });
  } else {
    html.classList.remove('is-arriving');
  }

  /* Leaving: drop the curtain, then navigate */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !(pageKey(url) in PAGE_NAMES)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    const name = PAGE_NAMES[pageKey(url)];
    store.set('pt', name);
    label.textContent = name;
    lenisInstance?.stop();
    gsap.timeline({ onComplete: () => { location.href = url.href; } })
      .set(curtain, { clipPath: hidden })
      .set(label, { yPercent: 100, autoAlpha: 0 })
      .to(curtain, { clipPath: covered, duration: reduce ? 0.01 : 0.8, ease: 'expo.inOut' })
      .to(label, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3');
  });

  /* Back/forward cache restores the page with the curtain still down */
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    gsap.set(curtain, { clipPath: hidden });
    lenisInstance?.start();
  });
}

/* ---------- Mobile menu ---------- */

export function setupMenu(gsap) {
  const nav = document.querySelector('.nav');
  const links = nav?.querySelectorAll('.nav__links a');
  if (!links?.length) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav__menu';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'menu');
  button.textContent = 'Menu';
  nav.append(button);

  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.id = 'menu';
  menu.hidden = true;
  const home = document.querySelector('.nav__logo')?.getAttribute('href') || 'index.html';
  const items = [['Home', home === '#top' ? '#top' : 'index.html'], ...[...links].map((a) => [a.childNodes[0].textContent.trim(), a.getAttribute('href')])];
  menu.innerHTML = `
    <nav class="menu__links" aria-label="Menu">
      ${items.map(([text, href], i) => `<a href="${href}"><span class="menu__num">0${i + 1}</span><span class="menu__text">${text}</span></a>`).join('')}
    </nav>
    <div class="menu__foot">
      <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>
      <span data-time>${document.querySelector('[data-time]')?.textContent || ''}</span>
    </div>`;
  document.body.append(menu);

  let open = false;
  const tl = gsap.timeline({ paused: true, onReverseComplete: () => { menu.hidden = true; } })
    .fromTo(menu, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: reduce ? 0.01 : 0.9, ease: 'expo.inOut' })
    .from(menu.querySelectorAll('.menu__text'), { yPercent: 110, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, '-=0.45')
    .from(menu.querySelectorAll('.menu__num, .menu__foot'), { autoAlpha: 0, duration: 0.6, stagger: 0.04 }, '<0.1');

  const toggle = (state) => {
    open = state;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      lenisInstance?.stop();
      tl.timeScale(1).play();
    } else {
      lenisInstance?.start();
      tl.timeScale(1.6).reverse();
    }
  };

  button.addEventListener('click', () => toggle(!open));
  // Capture phase: close (and restart smooth scroll) before an anchor link scrolls
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) toggle(false); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(false); });
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
    const link = e.target.closest('a, button, label, .service');
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

  /* Words light up as you read */
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.12 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
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
