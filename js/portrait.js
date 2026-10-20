import * as THREE from 'three';

/* Particle portrait: every non-background pixel of the photo becomes a point
   that assembles on load, scatters away from the pointer and drifts apart on scroll. */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform float uAssemble;
uniform float uScatter;
uniform float uSize;

attribute vec3 aColor;
attribute vec4 aRandom;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  vec3 dir = normalize(aRandom.xyz * 2.0 - 1.0 + 0.0001);

  // Gentle breathing so the portrait never feels frozen
  p.z += sin(uTime * 0.9 + aRandom.x * 6.2831) * 0.025;
  p.xy += vec2(sin(uTime * 0.6 + aRandom.y * 6.2831), cos(uTime * 0.5 + aRandom.z * 6.2831)) * 0.004;

  // Push points away from the pointer
  vec2 d = p.xy - uMouse;
  float force = smoothstep(0.6, 0.0, length(d)) * uHover;
  p.xy += normalize(d + 0.0001) * force * (0.25 + aRandom.y * 0.35);
  p.z += force * (0.4 + aRandom.z * 0.8);

  // Staggered assembly on load, then scatter as the page scrolls
  float local = clamp(uAssemble * 1.7 - aRandom.w * 0.7, 0.0, 1.0);
  float spread = max(1.0 - local * local * (3.0 - 2.0 * local), uScatter * (0.4 + aRandom.w));
  p += dir * spread * (1.5 + aRandom.w * 3.5);
  p.y += spread * aRandom.x * 0.8;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.75 + aRandom.w * 0.5) * (1.0 + force * 0.6);

  vColor = aColor;
  vAlpha = 1.0 - spread * 0.6;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.35, d));
}
`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function createPortrait(container, { src, reduce = false }) {
  const img = await loadImage(src);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  container.append(renderer.domElement);

  /* Sample the photo on a grid; the near-white studio background is skipped */
  const small = container.clientWidth < 420;
  const cols = small ? 110 : 160;
  const rows = Math.round(cols * (img.height / img.width));
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  const worldH = 4;
  const worldW = worldH * (cols / rows);
  const positions = [];
  const colors = [];
  const randoms = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (Math.min(r, g, b) >= 250) continue;
      positions.push((x / cols - 0.5) * worldW, (0.5 - y / rows) * worldH, 0);
      colors.push(r / 255, g / 255, b / 255);
      randoms.push(Math.random(), Math.random(), Math.random(), Math.random());
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 4));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uHover: { value: 0 },
    uAssemble: { value: reduce ? 1 : 0 },
    uScatter: { value: 0 },
    uSize: { value: 4 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);

  const scene = new THREE.Scene();
  scene.add(points);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

  /* Fit the portrait inside the container with a little breathing room */
  let frustum = { w: worldW, h: worldH };
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const fitH = Math.max(worldH, worldW / aspect) * 1.04;
    frustum = { w: fitH * aspect, h: fitH };
    Object.assign(camera, { left: -frustum.w / 2, right: frustum.w / 2, top: frustum.h / 2, bottom: -frustum.h / 2 });
    camera.updateProjectionMatrix();
    // One point per grid cell, in device pixels, slightly overlapping
    uniforms.uSize.value = (h / fitH) * (worldH / rows) * ratio * 1.6;
  }
  resize();
  new ResizeObserver(resize).observe(container);

  /* Pointer in world units */
  const mouse = new THREE.Vector2(99, 99);
  if (!reduce) {
    container.addEventListener('pointermove', (e) => {
      const r = container.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width - 0.5) * frustum.w, (0.5 - (e.clientY - r.top) / r.height) * frustum.h);
      window.gsap.to(uniforms.uHover, { value: 1, duration: 0.6, overwrite: 'auto' });
    });
    container.addEventListener('pointerleave', () => {
      window.gsap.to(uniforms.uHover, { value: 0, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    });
  }

  /* Only render while visible */
  const clock = new THREE.Clock();
  const tick = () => {
    uniforms.uTime.value += Math.min(clock.getDelta(), 0.05) * (reduce ? 0 : 1);
    uniforms.uMouse.value.lerp(mouse, 0.12);
    renderer.render(scene, camera);
  };
  new IntersectionObserver(([entry]) => {
    clock.getDelta();
    renderer.setAnimationLoop(entry.isIntersecting ? tick : null);
  }).observe(container);
  tick();

  container.classList.add('is-live');

  return {
    uniforms,
    assemble(duration = 2.6) {
      if (reduce) return;
      window.gsap.to(uniforms.uAssemble, { value: 1, duration, ease: 'power2.out' });
    },
  };
}
