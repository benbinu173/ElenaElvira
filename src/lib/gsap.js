import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// A single shared easing family keeps every transition on the page feeling
// like it came from the same hand.
export const EASE = {
  out: 'expo.out',
  soft: 'power3.out',
  inOut: 'power4.inOut',
  back: 'back.out(1.6)',
};

// ScrollTrigger measures the page height, and images arriving later change it.
// Rather than firing refresh() from every component, they all land here.
let refreshQueued = false;
export function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger };
