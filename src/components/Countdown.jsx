import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { revealOnScroll } from '../lib/anim.js';
import { BIRTHDAY } from '../data/photos.js';
import './countdown.css';

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
];

function measure(target) {
  const diff = target.getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return { done: true };

  const totalSeconds = Math.floor(diff / 1000);
  return {
    done: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * A real countdown to midnight on the twenty-second, to the second.
 * Only the cells whose value actually changed get re-animated, so the seconds
 * tick like a clock face instead of the whole row pulsing in unison.
 */
export default function Countdown() {
  const rootRef = useRef(null);
  const target = useMemo(() => new Date(BIRTHDAY), []);
  const [time, setTime] = useState(() => measure(target));
  const previousRef = useRef(time);
  const cellRefs = useRef({});

  useEffect(() => {
    const id = setInterval(() => setTime(measure(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  /* Reveal the row on scroll. */
  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.06,
      });
    }, section);

    return () => context.revert();
  }, []);

  /* Flip whichever cell changed. */
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = time;

    if (time.done || prefersReducedMotion()) return;

    UNITS.forEach(({ key }) => {
      if (previous[key] === time[key]) return;
      const node = cellRefs.current[key];
      if (!node) return;

      gsap.fromTo(
        node,
        { yPercent: previous[key] === undefined ? 0 : -22, autoAlpha: 0.35, rotateX: -38 },
        { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.55, ease: EASE.out }
      );
    });
  }, [time]);

  return (
    <section className="count section" ref={rootRef} aria-labelledby="count-title">
      <div className="shell count__inner">
        <div className="section-head">
          <h2 id="count-title" data-reveal>
            {time.done ? 'It is today' : 'Not long now'}
          </h2>
          <p className="lede" data-reveal>
            {time.done
              ? 'Happy birthday, Elena and Elvira. Everything below is yours.'
              : 'Counting down to midnight on the twenty-second of October.'}
          </p>
        </div>

        {time.done ? (
          <p className="count__today hand" data-reveal>
            twenty-two, ten
          </p>
        ) : (
          <div className="count__row" role="list">
            {UNITS.map(({ key, label }, index) => (
              <div className="count__cell" role="listitem" key={key}>
                {index > 0 && <span className="count__rule" aria-hidden="true" />}
                <span
                  className="count__value"
                  ref={(node) => {
                    cellRefs.current[key] = node;
                  }}
                >
                  {String(time[key] ?? 0).padStart(2, '0')}
                </span>
                <span className="count__label">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
