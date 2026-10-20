# Rojina — Portfolio

A static designer portfolio built with **Three.js** (WebGL blob), **GSAP + ScrollTrigger** (animation) and **Lenis** (smooth scroll). No build step: libraries load from jsDelivr, so it runs directly on GitHub Pages.

## Structure

```
index.html            home page markup and content
work.html             all projects, with category filters
project.html          case study page (project.html?p=<slug>)
404.html              GitHub Pages "not found" page
css/style.css         all styles (colors and fonts in :root)
js/common.js          shared: cursor, smooth scroll, reveals, clock
js/main.js            home: loader, 3D choreography, horizontal work scroll
js/page.js            work + case study pages: renders from projects.js
js/projects.js        project titles, text and covers (edit this)
js/scene.js           Three.js scene (noise-displaced shader blob + dust)
assets/               favicon, portrait (rojina.jpg) and your images
.github/workflows/    automatic GitHub Pages deploy
.nojekyll             tells Pages to serve files as is
```

## Run locally

ES modules don't run from `file://`, so use a local server:

```bash
python -m http.server 5500
# open http://localhost:5500
```

## Deploy to GitHub Pages

1. Create a repo (for example `rojina-portfolio`) and push this folder to the `main` branch.
2. On GitHub, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Each push to `main` deploys to `https://<username>.github.io/rojina-portfolio/`.

(Or choose **Deploy from a branch → main / root** instead; that works too, because all paths are relative.)

## Customising

- **Text, email, socials:** `index.html` (and the contact block in `work.html` / `project.html`)
- **Project case studies:** `js/projects.js` — one entry per project; the home page cards link to `project.html?p=<slug>`
- **Portrait:** replace `assets/rojina.jpg`
- **Project images:** put files in `assets/work/` and replace each `.cover` div with
  `<img src="assets/work/name.jpg" alt="...">` inside `.project__media`. The parallax still works.
- **Colors and fonts:** the `:root` variables in `css/style.css`. The blob palette is `uC1`–`uC4` in `js/scene.js`.
- **Clock time zone:** `CONFIG` at the top of `js/main.js`
- **Blob position per section:** `PRESETS` in `js/scene.js`

Respects `prefers-reduced-motion`. If WebGL or a CDN fails, the site still works without the 3D scene.
