import * as THREE from 'three';

/* Ashima / Stefan Gustavson 3D simplex noise */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uDistort;
uniform float uFreq;
uniform float uKick;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

${NOISE}

float field(vec3 p) {
  float t = uTime * 0.22;
  float n = snoise(p * uFreq + vec3(t, t * 0.7, -t));
  n += 0.35 * snoise(p * uFreq * 2.3 + vec3(-t * 1.3, t, t * 0.5));
  return n;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

vec3 displace(vec3 p, float amp) {
  return p + normalize(p) * field(p) * amp;
}

void main() {
  float amp = uDistort + uKick;
  vec3 n = normalize(position);

  // Recompute the normal from two neighbouring displaced points
  vec3 t = orthogonal(n);
  vec3 b = normalize(cross(n, t));
  float e = 0.012;
  vec3 p  = displace(position, amp);
  vec3 pa = displace(position + t * e, amp);
  vec3 pb = displace(position + b * e, amp);

  vNoise = field(position);
  vNormal = normalize(normalMatrix * normalize(cross(pa - p, pb - p)));

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform float uHue;
uniform float uDark;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

vec3 ramp(float t) {
  t = fract(t) * 4.0;
  float f = smoothstep(0.0, 1.0, fract(t));
  if (t < 1.0) return mix(uC1, uC2, f);
  if (t < 2.0) return mix(uC2, uC3, f);
  if (t < 3.0) return mix(uC3, uC4, f);
  return mix(uC4, uC1, f);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(-0.4, 0.9, 0.7));
  vec3 H = normalize(L + V);

  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 60.0);

  vec3 col = ramp(vNoise * 0.18 + N.y * 0.12 + fres * 0.3 + uHue);
  col *= 0.66 + 0.45 * diff;
  col += spec * 0.5;

  vec3 rim = mix(vec3(1.0, 0.96, 0.92), vec3(0.72, 0.68, 1.0), uDark);
  col = mix(col, rim, fres * 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`;

const hexToVec3 = (hex) => {
  const c = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255);
};

/* Where the blob sits for each section (x/y in world units at desktop size) */
const PRESETS = {
  hero:     { x: 0,    y: 0.35,  scale: 1,    distort: 0.32, freq: 0.95, hue: 0 },
  about:    { x: 2.3,  y: -0.2,  scale: 0.72, distort: 0.48, freq: 1.4,  hue: 0.18 },
  services: { x: -2.4, y: 0.2,   scale: 0.58, distort: 0.26, freq: 2.0,  hue: 0.36 },
  work:     { x: 0,    y: 0,     scale: 1.45, distort: 0.55, freq: 0.8,  hue: 0.55 },
  contact:  { x: 1.8,  y: 0.4,   scale: 0.95, distort: 0.4,  freq: 1.2,  hue: 0.08 },
};

export function createScene(canvas, { reduce = false } = {}) {
  const { gsap } = window;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }

  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 8;

  /* Blob */
  const uniforms = {
    uTime: { value: 0 },
    uDistort: { value: PRESETS.hero.distort },
    uFreq: { value: PRESETS.hero.freq },
    uKick: { value: 0 },
    uHue: { value: 0 },
    uDark: { value: 0 },
    uC1: { value: hexToVec3('#FF4F1F') },
    uC2: { value: hexToVec3('#FF9EC7') },
    uC3: { value: hexToVec3('#B9B2FF') },
    uC4: { value: hexToVec3('#F6E7D2') },
  };

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, isSmall ? 40 : 72),
    new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
  );
  const group = new THREE.Group();
  group.add(blob);
  scene.add(group);

  /* Dust */
  const count = isSmall ? 700 : 1600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.8 + Math.random() * 3.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.6;
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) - 1.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.018,
    color: new THREE.Color('#0E0E0E'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* State */
  const state = { ...PRESETS.hero, scale: 0 };
  let target = 'hero';
  let introDone = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let kick = 0;
  let view = { w: 1, h: 1 };

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    view = { w: visH * camera.aspect, h: visH };
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const speed = reduce ? 0.25 : 1;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt * speed;

    // Fit the composition to narrow screens
    const xFactor = Math.min(1, view.w / 9);
    const sFactor = THREE.MathUtils.clamp(view.w / 6.5, 0.55, 1);

    group.position.x = state.x * xFactor;
    group.position.y = state.y * Math.min(1, view.h / 5);
    group.scale.setScalar(Math.max(state.scale * sFactor, 0.0001));

    uniforms.uDistort.value = state.distort;
    uniforms.uFreq.value = state.freq;
    uniforms.uHue.value = state.hue;

    kick *= 0.92;
    uniforms.uKick.value += (kick - uniforms.uKick.value) * 0.1;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    blob.rotation.y += dt * 0.08 * speed;
    group.rotation.y = pointer.x * 0.5;
    group.rotation.x = -pointer.y * 0.35;

    dust.rotation.y += dt * 0.015 * speed;
    dust.position.x = pointer.x * 0.15;
    dust.position.y = pointer.y * 0.1;

    renderer.render(scene, camera);
  });

  return {
    go(name) {
      if (!PRESETS[name]) return;
      target = name;
      if (!introDone) return;
      gsap.to(state, { ...PRESETS[name], duration: reduce ? 0.01 : 2, ease: 'power3.inOut', overwrite: 'auto' });
    },
    intro() {
      introDone = true;
      gsap.to(state, { ...PRESETS[target], duration: reduce ? 0.01 : 2.4, ease: 'elastic.out(1, 0.6)', overwrite: 'auto' });
    },
    pointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    kick(velocity) {
      if (reduce) return;
      kick = Math.max(kick, Math.min(Math.abs(velocity) / 4000, 0.3));
    },
    setTheme(dark) {
      const c = new THREE.Color(dark ? '#EDEAE4' : '#0E0E0E');
      gsap.to(dustMat.color, { r: c.r, g: c.g, b: c.b, duration: 0.8 });
      gsap.to(uniforms.uDark, { value: dark ? 1 : 0, duration: 0.8 });
    },
  };
}
