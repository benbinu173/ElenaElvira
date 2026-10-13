import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { burstFromElement } from '../lib/confetti.js';
import { playBlow, playBirthday } from '../lib/audio.js';
import { TWINS } from '../data/photos.js';
import './candles.css';

const PAIR = [TWINS.elena, TWINS.elvi];

/**
 * One candle each. Blow one out, the other stays lit, and the line underneath
 * only changes once both are gone, so the two of them finish it together.
 *
 * Nothing is persisted: a reload gives you two fresh candles, which is also
 * what makes this bearable to demo more than once.
 */
export default function Candles() {
  const rootRef = useRef(null);
  const flameRefs = useRef({});
  const [out, setOut] = useState({});

  const bothOut = PAIR.every((twin) => out[twin.tone]);

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.08,
      });
    }, section);

    return () => context.revert();
  }, []);

  const blow = (tone) => {
    if (out[tone]) return;

    setOut((current) => ({ ...current, [tone]: true }));
    playBlow();
    burstFromElement(flameRefs.current[tone], { count: 16, power: 6, scale: 0.7 });

    const remaining = PAIR.filter((twin) => twin.tone !== tone && !out[twin.tone]).length;
    if (remaining === 0) {
      // A beat after the smoke starts, so the tune arrives as a reply to the
      // blow rather than as a click sound. Nothing plays unless sound is on.
      window.setTimeout(() => playBirthday(), 460);
    }

    if (prefersReducedMotion()) return;

    gsap.fromTo(
      flameRefs.current[tone],
      { scaleY: 1, autoAlpha: 1 },
      { scaleY: 0.4, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }
    );
  };

  return (
    <section className="candles section" ref={rootRef} aria-labelledby="candles-title">
      <div className="shell candles__inner">
        <div className="section-head candles__head">
          <h2 id="candles-title" data-reveal>
            One candle each
          </h2>
          <p className="lede" data-reveal>
            Go on. Blow them out and make it count.
          </p>
        </div>

        <div className="candles__pair">
          {PAIR.map((twin) => {
            const isOut = Boolean(out[twin.tone]);

            return (
              <button
                type="button"
                key={twin.tone}
                className={`candle candle--${twin.tone}`}
                data-lit={!isOut}
                data-reveal
                onClick={() => blow(twin.tone)}
                aria-label={isOut ? `${twin.name}'s candle is out` : `Blow out ${twin.name}'s candle`}
                aria-disabled={isOut}
              >
                <span className="candle__flame-wrap">
                  <span className="candle__glow" aria-hidden="true" />
                  <span
                    className="candle__flame"
                    aria-hidden="true"
                    ref={(node) => {
                      flameRefs.current[twin.tone] = node;
                    }}
                  />
                  <span className="candle__smoke" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>

                <span className="candle__wick" aria-hidden="true" />
                <span className="candle__body" aria-hidden="true" />
                <span className="candle__base" aria-hidden="true" />
                <span className="candle__name">{twin.name}</span>
              </button>
            );
          })}
        </div>

        <p className="candles__after hand" aria-live="polite">
          {bothOut ? 'Both out. Now wait for the twenty-second.' : ' '}
        </p>
      </div>
    </section>
  );
}
