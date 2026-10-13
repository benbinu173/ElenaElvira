import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * Slow warm dust drifting upward behind everything.
 *
 * Count scales with viewport area so phones do not pay for a desktop's worth
 * of particles. Skipped entirely under reduced motion.
 */
export default function AmbientParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const COLORS = [
      [240, 194, 123],
      [233, 160, 168],
      [251, 243, 231],
      [200, 147, 63],
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let motes = [];
    let frame = null;
    let visible = true;

    const build = (reseed) => {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;

      /* A phone's address bar collapsing fires a resize with the width
         unchanged and the viewport a little taller. Rebuilding the field on
         that would make every mote jump position each time the visitor
         scrolls, which reads as the dust twitching rather than drifting. Only
         a change in width or in pixel density means the layout really moved. */
      const shouldReseed = reseed || nextWidth !== width || nextDpr !== dpr;

      dpr = nextDpr;
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(Math.max((width * height) / 26000, 22), 78));

      if (shouldReseed) {
        motes = Array.from({ length: count }, () => spawn(true));
        return;
      }

      // Keep what is already in flight and only make up the difference.
      while (motes.length > count) motes.pop();
      while (motes.length < count) motes.push(spawn(true));
    };

    const spawn = (anywhere) => {
      const color = COLORS[(Math.random() * COLORS.length) | 0];
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : height + 12,
        r: 0.6 + Math.random() * 1.7,
        speed: 0.16 + Math.random() * 0.5,
        sway: 0.3 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.12 + Math.random() * 0.4,
        color,
      };
    };

    let time = 0;

    const draw = () => {
      frame = null;
      if (!visible) return;

      time += 0.006;
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < motes.length; i += 1) {
        const m = motes[i];
        m.y -= m.speed;
        m.x += Math.sin(time + m.phase) * m.sway * 0.14;

        if (m.y < -14) motes[i] = spawn(false);

        const [r, g, b] = m.color;
        context.beginPath();
        context.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${m.alpha})`;
        context.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (frame === null) frame = requestAnimationFrame(draw);
    };

    build(true);
    startLoop();

    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => build(false), 180);
    };

    // Pausing when the tab is hidden keeps the battery honest.
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) startLoop();
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas className="ambient-canvas" ref={canvasRef} aria-hidden="true" />;
}
