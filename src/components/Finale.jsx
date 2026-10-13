import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { burstFromElement, storm } from '../lib/confetti.js';
import { playPop, playChime } from '../lib/audio.js';
import './finale.css';

const ELENA = ['E', 'L', 'E', 'N', 'A'];
const ELVIRA = ['E', 'L', 'V', 'I', 'R', 'A'];

export default function Finale() {
  const rootRef = useRef(null);
  const namesRef = useRef(null);
  const [popped, setPopped] = useState(() => new Set());

  const total = ELENA.length + ELVIRA.length;
  const allPopped = popped.size >= total;

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.1,
      });
    }, section);

    return () => context.revert();
  }, []);

  const pop = useCallback((key, element) => {
    setPopped((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });

    playPop();
    burstFromElement(element, { count: 28, power: 10, scale: 0.95 });
  }, []);

  /* Once the last letter goes, they float back up. The joke only works if you
     can do it again. */
  useEffect(() => {
    if (!allPopped || total === 0) return undefined;

    const timer = window.setTimeout(() => {
      const letters = namesRef.current
        ? Array.from(namesRef.current.querySelectorAll('.finale__letter'))
        : [];

      setPopped(new Set());
      playChime(600);

      if (prefersReducedMotion() || !letters.length) return;
      gsap.fromTo(
        letters,
        { scale: 0.2, autoAlpha: 0, y: 40 },
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.045, ease: 'back.out(1.9)' }
      );
    }, 950);

    return () => window.clearTimeout(timer);
  }, [allPopped, total]);

  /* The float animation lives on an inner span and the pop transform on the
     button, because a CSS animation on `transform` would otherwise beat both
     the popped state and anything GSAP writes. */
  const renderWord = (letters, tone, label) => (
    <span className={`finale__word finale__word--${tone}`} aria-hidden="true">
      {letters.map((letter, index) => {
        const key = `${label}-${index}`;
        const isPopped = popped.has(key);

        return (
          <button
            type="button"
            key={key}
            className="finale__letter"
            data-popped={isPopped}
            tabIndex={-1}
            onClick={(event) => pop(key, event.currentTarget)}
          >
            <span className="finale__letter-inner">{letter}</span>
          </button>
        );
      })}
    </span>
  );

  return (
    <section className="finale section" ref={rootRef} aria-labelledby="finale-title">
      <div className="shell finale__inner">
        <h2 className="finale__wish display" id="finale-title" aria-label="Happy Birthday Elena and Elvira" data-reveal>
          Happy Birthday
        </h2>

        <div className="finale__names" ref={namesRef} data-reveal>
          {renderWord(ELENA, 'gold', 'elena')}
          <span className="finale__amp" aria-hidden="true">
            &amp;
          </span>
          {renderWord(ELVIRA, 'rose', 'elvi')}
        </div>

        <p className="finale__note" data-reveal>
          You were born on the same day, and you have been each other&apos;s witness ever since. Here
          is to another year of it. And another. And another.
        </p>

        <button
          type="button"
          className="btn btn--solid finale__again"
          onClick={() => {
            storm();
            playChime(520);
          }}
          data-reveal
        >
          One more time
        </button>

        <p className="finale__hint" data-reveal>
          Tap a letter, if you must.
        </p>
      </div>
    </section>
  );
}
