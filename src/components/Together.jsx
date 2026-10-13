import { useEffect, useMemo, useRef } from 'react';
import { gsap } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { BORN } from '../data/photos.js';
import './together.css';

const MS_PER_DAY = 86400000;

/** 7884 reads as a quantity; 7,884 reads as an amount. It matters here. */
function group(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function daysSince(dateString) {
  if (!dateString) return null;

  const born = new Date(dateString);
  if (Number.isNaN(born.getTime())) return null;

  const elapsed = Date.now() - born.getTime();
  if (elapsed < 0) return null;

  return Math.floor(elapsed / MS_PER_DAY);
}

/**
 * The page counts down to the twenty-second. This counts the other way, from
 * the morning they arrived, which is the half of the story a countdown misses.
 *
 * The rendered number is always the true final value. The count-up overwrites
 * it in the DOM while it runs and never re-renders React, so if the animation
 * is skipped, broken, or switched off, the correct figure is already on screen.
 */
export default function Together() {
  const rootRef = useRef(null);
  const numberRef = useRef(null);
  const days = useMemo(() => daysSince(BORN), []);

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.08,
      });

      if (days === null || prefersReducedMotion()) return;

      const node = numberRef.current;
      if (!node) return;

      /* Counts up from two thirds of the way, not from zero: rising through
         twelve thousand numbers is a loading bar, rising through the last few
         thousand is a reveal.

         Two things here are load-bearing. The ScrollTrigger is what stops the
         count running at page load, four screens before anyone sees it. And
         onStart is what stops the visible jump: without it the true figure sits
         in the DOM until the first animation tick, so the number reads high,
         drops, and climbs. onStart writes the low value in the same frame the
         tween begins, which is also the frame the reveal starts from opacity 0,
         so the drop is never seen. */
      const counter = { value: Math.floor(days * 0.66) };
      gsap.to(counter, {
        value: days,
        duration: 2.1,
        ease: 'power2.out',
        onStart: () => {
          node.textContent = group(Math.floor(days * 0.66));
        },
        onUpdate: () => {
          node.textContent = group(Math.round(counter.value));
        },
        onComplete: () => {
          node.textContent = group(days);
        },
        scrollTrigger: { trigger: section, start: 'top 84%', once: true },
      });
    }, section);

    return () => context.revert();
  }, [days]);

  return (
    <section className="together section" ref={rootRef} aria-labelledby="together-title">
      <div className="shell together__inner">
        <p className="eyebrow together__eyebrow" data-reveal>
          And the other direction
        </p>

        <h2 id="together-title" className="together__title display" data-reveal>
          Together since the first morning
        </h2>

        {days === null ? (
          <p className="lede together__note" data-reveal>
            You arrived on the same day, and neither of you has had a day since that the other was
            not part of. Most people have to go looking for that. You were handed it.
          </p>
        ) : (
          <>
            <div className="together__count" data-reveal>
              <span className="together__number" ref={numberRef}>
                {group(days)}
              </span>
              <span className="together__unit">days</span>
            </div>

            <p className="lede together__note" data-reveal>
              And not one of them spent alone. That is the whole trick of being two, and you have
              had it since the very beginning.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
