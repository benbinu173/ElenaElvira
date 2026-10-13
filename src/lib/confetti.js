import { prefersReducedMotion } from './motion.js';

/**
 * A small self-contained confetti engine.
 *
 * One shared canvas, one rAF loop, no dependencies. The loop stops itself the
 * moment the last particle dies, so an idle page costs nothing.
 */

const COLORS = ['#f0c27b', '#e9a0a8', '#fbf3e7', '#c8933f', '#c46f7c', '#d8c8ea'];
const GRAVITY = 0.22;
const DRAG = 0.988;
const MAX_PARTICLES = 900;

let surface = null;
let context = null;
let dpr = 1;
let frame = null;
let particles = [];

function ensureSurface() {
  if (surface) return true;
  if (typeof document === 'undefined') return false;

  surface = document.createElement('canvas');
  surface.className = 'confetti-layer';
  surface.setAttribute('aria-hidden', 'true');
  document.body.appendChild(surface);

  context = surface.getContext('2d');
  if (!context) {
    surface.remove();
    surface = null;
    return false;
  }

  resize();
  window.addEventListener('resize', resize);
  return true;
}

function resize() {
  if (!surface || !context) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { innerWidth: w, innerHeight: h } = window;
  surface.width = Math.floor(w * dpr);
  surface.height = Math.floor(h * dpr);
  surface.style.width = `${w}px`;
  surface.style.height = `${h}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function make(count, origin, options) {
  const {
    colors = COLORS,
    spread = Math.PI * 2,
    angle = -Math.PI / 2,
    power = 11,
    scale = 1,
    drift = 0,
  } = options;

  for (let i = 0; i < count; i += 1) {
    if (particles.length >= MAX_PARTICLES) break;

    const heading = angle + (Math.random() - 0.5) * spread;
    const speed = power * (0.45 + Math.random() * 0.75);
    const ribbon = Math.random() > 0.72;

    particles.push({
      x: origin.x + (Math.random() - 0.5) * 18,
      y: origin.y + (Math.random() - 0.5) * 18,
      vx: Math.cos(heading) * speed + drift,
      vy: Math.sin(heading) * speed,
      w: (ribbon ? 2.5 : 5 + Math.random() * 5) * scale,
      h: (ribbon ? 11 + Math.random() * 9 : 4 + Math.random() * 4) * scale,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.34,
      color: colors[(Math.random() * colors.length) | 0],
      life: 0,
      ttl: 90 + Math.random() * 90,
      shape: ribbon ? 'ribbon' : Math.random() > 0.7 ? 'dot' : 'chip',
    });
  }

  start();
}

function start() {
  if (frame || !context) return;
  frame = requestAnimationFrame(tick);
}

function tick() {
  frame = null;
  if (!context || !surface) return;

  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life += 1;
    p.vy += GRAVITY;
    p.vx *= DRAG;
    p.vy *= DRAG;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;

    if (p.life > p.ttl || p.y > window.innerHeight + 60) {
      particles.splice(i, 1);
      continue;
    }

    const fade = 1 - Math.max(0, (p.life - p.ttl * 0.65) / (p.ttl * 0.35));

    context.save();
    context.globalAlpha = Math.min(1, fade);
    context.translate(p.x, p.y);
    context.rotate(p.rot);
    context.fillStyle = p.color;

    if (p.shape === 'dot') {
      context.beginPath();
      context.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
      context.fill();
    } else {
      // A cheap flutter: the chip's visible height breathes as it spins.
      const squash = Math.abs(Math.cos(p.rot)) * 0.65 + 0.35;
      context.fillRect(-p.w / 2, (-p.h * squash) / 2, p.w, p.h * squash);
    }

    context.restore();
  }

  if (particles.length) {
    frame = requestAnimationFrame(tick);
  } else {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

/** A directional pop, usually aimed at the centre of a clicked element. */
export function burstFromElement(element, options = {}) {
  if (prefersReducedMotion() || !ensureSurface() || !element) return;
  const rect = element.getBoundingClientRect();
  make(options.count ?? 34, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, options);
}

export function burstAt(x, y, options = {}) {
  if (prefersReducedMotion() || !ensureSurface()) return;
  make(options.count ?? 34, { x, y }, options);
}

/** Everything at once, from the bottom of the screen. Used for the finale. */
export function storm(options = {}) {
  if (prefersReducedMotion() || !ensureSurface()) return;
  const width = window.innerWidth;
  const height = window.innerHeight;

  make(180, { x: width / 2, y: height + 20 }, {
    ...options,
    power: 26,
    spread: Math.PI * 0.62,
    angle: -Math.PI / 2,
    scale: 1.25,
  });

  // Two side cannons so it reads as a room celebrating, not a single jet.
  setTimeout(() => {
    if (!context) return;
    make(90, { x: 0, y: height * 0.72 }, {
      power: 24, angle: -Math.PI / 3.4, spread: Math.PI / 5, scale: 1.1,
    });
    make(90, { x: width, y: height * 0.72 }, {
      power: 24, angle: -Math.PI + Math.PI / 3.4, spread: Math.PI / 5, scale: 1.1,
    });
  }, 160);
}

/**
 * A handful of embers from a click. Deliberately tiny: this is feedback that
 * the page heard the tap, not a firework. It never replaces the real cursor.
 */
export function sparkle(x, y) {
  if (prefersReducedMotion() || !ensureSurface()) return;
  const count = 7;

  for (let i = 0; i < count; i += 1) {
    if (particles.length >= MAX_PARTICLES) break;
    const heading = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 2.6;

    particles.push({
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed - 0.6,
      w: 2 + Math.random() * 2.5,
      h: 2 + Math.random() * 2.5,
      rot: 0,
      vrot: 0,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 0,
      ttl: 26 + Math.random() * 22,
      shape: 'dot',
    });
  }

  start();
}

/** Gentle fall from above. Used while a wish is being written. */
export function drift(duration = 2600) {
  if (prefersReducedMotion() || !ensureSurface()) return;
  const width = window.innerWidth;
  const startedAt = performance.now();

  const sprinkle = () => {
    if (!surface) return;
    make(7, { x: Math.random() * width, y: -30 }, {
      angle: Math.PI / 2,
      spread: Math.PI / 2.6,
      power: 1.6,
      scale: 0.85,
    });
    if (performance.now() - startedAt < duration) setTimeout(sprinkle, 190);
  };

  sprinkle();
}
