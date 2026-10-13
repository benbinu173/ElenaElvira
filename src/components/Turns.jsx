import { useEffect, useRef } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { TURNS } from '../data/photos.js';
import './turns.css';

/**
 * How far below the line the middle of the garland hangs. A string of lights
 * pinned at both ends sags; a flat row of them reads as a progress bar.
 */
const SAG = 22;

/**
 * One bulb per year, alternating gold and rose so the garland is visibly made
 * of both of them.
 *
 * The count is derived, so this has to hold for any number, not just this
 * year's. An even count splits down the middle exactly; an odd one gives Elena
 * the extra, since the row starts on gold. Both are fine, and the caption
 * below says which of the two happened rather than pretending it is even.
 */
function buildLights(count) {
  return Array.from({ length: count }, (_, index) => {
    const t = count > 1 ? index / (count - 1) : 0.5;
    return {
      key: index,
      tone: index % 2 === 0 ? 'gold' : 'rose',
      sag: Math.sin(t * Math.PI) * SAG,
    };
  });
}

/**
 * The number they turn.
 *
 * The countdown counts to the twenty-second and the section after this one
 * counts the days behind it; neither of them says the age out loud. This does,
 * and it is the only place on the page where the two of them are treated as a
 * single quantity: the two digits arrive from opposite sides and meet, which is
 * the same idea as the hero, upside down.
 *
 * The component is named after the verb rather than the number on purpose. The
 * figure comes from TURNS, so this file has to survive it changing.
 */
export default function Turns() {
  const rootRef = useRef(null);

  const lights = TURNS ? buildLights(TURNS) : [];
  const digits = TURNS ? String(TURNS).split('') : [];

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.08,
      });

      if (prefersReducedMotion()) return;

      /* The two digits close the gap between them. Only run when there are
         exactly two: with any other number of digits there is no pair to bring
         together, and the halves would fly in from the wrong places.

         Two tweens rather than one with a function-based value, and the to-vars
         built fresh for each. ScrollTrigger writes its own instance back onto
         the vars object it is handed, so a shared one would be handed to the
         second tween already built. */
      const halves = gsap.utils.toArray(section.querySelectorAll('.turns__digit'));
      if (halves.length === 2) {
        const meet = () => ({
          autoAlpha: 1,
          xPercent: 0,
          duration: 1.25,
          ease: EASE.out,
          scrollTrigger: { trigger: section, start: 'top 84%', once: true },
        });

        gsap.fromTo(halves[0], { autoAlpha: 0, xPercent: -110 }, meet());
        gsap.fromTo(halves[1], { autoAlpha: 0, xPercent: 110 }, meet());
      }

      /* The number leads and the garland answers it. Both triggers hang off the
         section, so the percentages decide the order: 84% fires before 78%.
         Without the gap the lights would start igniting in the same frame the
         digits began moving, and the section would have no last beat. */
      const bulbs = gsap.utils.toArray(section.querySelectorAll('.light__bulb'));
      if (bulbs.length) {
        gsap.fromTo(
          bulbs,
          { autoAlpha: 0, scale: 0.3 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.55,
            ease: 'back.out(2.2)',
            stagger: { each: 0.055, from: 'start' },
            scrollTrigger: { trigger: section, start: 'top 78%', once: true },
          }
        );
      }
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section className="turns section" ref={rootRef} aria-labelledby="turns-title">
      <div className="shell turns__inner">
        <p className="eyebrow" data-reveal>
          And on the twenty-second
        </p>

        {TURNS ? (
          <h2 id="turns-title" className="turns__age display">
            <span className="visually-hidden">Twenty-one years old</span>
            <span className="turns__digits" aria-hidden="true">
              {digits.map((digit, index) => (
                <span className="turns__digit" key={index}>
                  {digit}
                </span>
              ))}
            </span>
          </h2>
        ) : (
          <h2 id="turns-title" className="turns__age turns__age--word display">
            Many happy returns
          </h2>
        )}

        <p className="hand turns__hand" data-reveal>
          happy birthday, you two
        </p>

        {TURNS ? (
          <>
            {/* The number is derived; a fact about it cannot be. This copy is
                written for twenty-one and would need a new line if TURNS ever
                changed. */}
            <p className="lede turns__lede" data-reveal>
              Twenty-one will not divide in two. There is always one left over — which is the
              oldest complaint about being a twin, and the whole point of it.
            </p>

            {/* No drawn wire between the bulbs. A curve in SVG has to be kept in
                step with the sag values above by hand, and a wire that is a few
                pixels off its own lights looks worse than no wire. The arc
                alone already reads as something strung up. */}
            <div
              className="turns__garland"
              role="img"
              aria-label="Twenty-one lights, one for each year"
            >
              {lights.map((light) => (
                <span
                  className="light"
                  key={light.key}
                  data-tone={light.tone}
                  style={{ '--sag': `${light.sag}px` }}
                  aria-hidden="true"
                >
                  <span className="light__bulb" />
                </span>
              ))}
            </div>

            <p className="turns__caption" data-reveal>
              One light for every year. Eleven of them are gold and ten are rose, because
              twenty-one will not come apart evenly and one of you has to take the extra.
            </p>
          </>
        ) : (
          <p className="lede turns__lede" data-reveal>
            The two of you have spent every one of them with the other one in it. Very few people
            get to say that about a number that big.
          </p>
        )}
      </div>
    </section>
  );
}
