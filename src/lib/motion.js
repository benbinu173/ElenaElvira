import { useEffect, useState } from 'react';
import { queueRefresh } from './gsap.js';

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/** React-facing version, for the handful of components that branch in render. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Locks page scroll while an overlay is open.
 *
 * Plain `overflow: hidden` on the body throws away the scroll position in most
 * browsers, so the body is pinned in place with a negative offset instead and
 * the exact position is restored on the way out. ScrollTrigger is asked to
 * re-measure afterwards, because pinning the body briefly collapses the page
 * height out from under it.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const gap = window.innerWidth - document.documentElement.clientWidth;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      Object.assign(body.style, previous);
      window.scrollTo(0, scrollY);
      queueRefresh();
    };
  }, [locked]);
}
