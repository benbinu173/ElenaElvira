import { gsap, EASE } from './gsap.js';
import { prefersReducedMotion } from './motion.js';

/**
 * Shared reveal-on-scroll. Must be called inside a gsap.context() so the
 * ScrollTriggers it creates are torn down with everything else.
 *
 * Uses fromTo rather than from, because the elements it targets start at
 * opacity 0 in CSS and a `from` tween would read that 0 as the end state.
 */
export function revealOnScroll(targets, options = {}) {
  const {
    trigger,
    y = 34,
    stagger = 0.08,
    start = 'top 84%',
    duration = 0.95,
    delay = 0,
  } = options;

  const list = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
  if (!list.length) return null;

  if (prefersReducedMotion()) {
    gsap.set(list, { autoAlpha: 1, y: 0, clearProps: 'transform' });
    return null;
  }

  return gsap.fromTo(
    list,
    { autoAlpha: 0, y },
    {
      autoAlpha: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: EASE.out,
      /* Hand the transform back to CSS once the reveal is done, so hover
         states on these same elements keep working afterwards. */
      clearProps: 'transform',
      scrollTrigger: {
        trigger: trigger || list[0],
        start,
        once: true,
      },
    }
  );
}
