import { useEffect, useRef } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { THEN_NOW } from '../data/photos.js';
import './thennow.css';

/**
 * Then and now, in one frame, with a line you drag between them.
 *
 * The divider is driven by a real `<input type="range">` sitting invisibly on
 * top of the frame. That gives native drag, native touch, and native keyboard
 * support for free, and the value is written straight to a CSS custom property
 * so dragging never re-renders React.
 */
export default function ThenNow() {
  const rootRef = useRef(null);
  const frameRef = useRef(null);

  const { then: thenPhoto, now: nowPhoto } = THEN_NOW;

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const media = gsap.matchMedia();

    media.add({ reduced: '(prefers-reduced-motion: reduce)' }, (self) => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.08,
      });

      if (self.conditions.reduced) return;

      gsap.fromTo(
        frameRef.current,
        { clipPath: 'inset(12% 8% 12% 8%)', autoAlpha: 0 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          autoAlpha: 1,
          duration: 1.3,
          ease: EASE.out,
          scrollTrigger: { trigger: frameRef.current, start: 'top 82%', once: true },
        }
      );
    }, section);

    return () => media.revert();
  }, []);

  if (!thenPhoto || !nowPhoto) return null;

  /* Written straight to a custom property: dragging never re-renders React. */
  const moveLine = (event) => {
    frameRef.current?.style.setProperty('--pos', `${event.target.value}%`);
  };

  return (
    <section className="compare section" ref={rootRef} aria-labelledby="compare-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="compare-title" data-reveal>
            Same two, only taller
          </h2>
          <p className="lede" data-reveal>
            Drag the line to move between then and now.
          </p>
        </div>

        <div
          className="compare__frame"
          ref={frameRef}
          style={{ '--pos': '50%' }}
        >
          <img
            className="compare__image"
            src={thenPhoto.src}
            alt={thenPhoto.alt}
            loading="lazy"
            decoding="async"
            draggable="false"
          />
          <img
            className="compare__image compare__image--over"
            src={nowPhoto.src}
            alt={nowPhoto.alt}
            loading="lazy"
            decoding="async"
            draggable="false"
          />

          <span className="compare__handle" aria-hidden="true">
            <span className="compare__knob">
              <i />
              <i />
            </span>
          </span>

          <input
            type="range"
            className="compare__range"
            min="0"
            max="100"
            step="0.2"
            defaultValue="50"
            onInput={moveLine}
            aria-label="Move between the childhood photograph and the recent one"
          />
        </div>

        <div className="compare__legend" data-reveal>
          <span className="compare__legend-item hand">then</span>
          <span className="compare__legend-item hand">now</span>
        </div>
      </div>
    </section>
  );
}
