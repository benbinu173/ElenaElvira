import { useEffect, useRef } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/motion.js';
import './hero.css';

/**
 * ELENA | ELVIRA, split by a seam of light, each name with a reflection under it.
 *
 * The reflection is the whole idea in one move: two people, one mirror. It runs
 * at low opacity so the mirrored text never competes with the real thing.
 */
export default function Hero({ started }) {
  const rootRef = useRef(null);
  const auraElenaRef = useRef(null);
  const auraElviRef = useRef(null);

  /* Entrance. Runs once, the moment the curtain has opened. */
  useEffect(() => {
    if (!started) return undefined;

    const reduced = prefersReducedMotion();

    const context = gsap.context(() => {
      const words = gsap.utils.toArray('.hero__word-inner');
      const mirrors = gsap.utils.toArray('.hero__mirror');
      const soft = gsap.utils.toArray('.hero__anim');

      /* Clear the pixel offset the stylesheet's hiding transform left behind.

         `.js .hero__word-inner` parks each name at translateY(112%) so it is
         hidden until the timeline runs. GSAP reads that computed transform as a
         matrix and files it away as `y: 201px` — it has no way to know it was
         ever a percentage. From then on, animating `yPercent` never touches
         `y`, so every tween below can run perfectly and still leave the name
         sitting under its own mask, with nothing on screen but the reflection.

         Zeroing `y` once here is what lets the slide actually move anything, and
         it has to come before the reduced-motion branch returns, because
         `yPercent: 0` on its own has exactly the same blind spot. */
      gsap.set(words, { y: 0 });

      if (reduced) {
        gsap.set(words, { yPercent: 0 });
        gsap.set(mirrors, { autoAlpha: 0.16, y: 0 });
        gsap.set(soft, { autoAlpha: 1, y: 0 });
        gsap.set('.hero__aura span', { autoAlpha: 1, scale: 1 });
        gsap.set('.hero__seam', { scaleY: 1 });
        return;
      }

      /* fromTo rather than to, so the start of the slide is stated here instead
         of being inferred from the element. See the note above about what the
         stylesheet's transform does to GSAP's idea of where these already are. */
      const timeline = gsap.timeline({ defaults: { ease: EASE.out } });

      timeline
        .to('.hero__aura span', { autoAlpha: 1, scale: 1, duration: 2.2, stagger: 0.18 }, 0)
        .to('.hero__seam', { scaleY: 1, duration: 1.4, ease: 'power4.inOut' }, 0.15)
        .fromTo(words, { yPercent: 112 }, { yPercent: 0, duration: 1.25, stagger: 0.14 }, 0.35)
        .fromTo(
          mirrors,
          { autoAlpha: 0, y: -14 },
          { autoAlpha: 0.16, y: 0, duration: 1.1, stagger: 0.14 },
          0.75
        )
        .to(soft, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.9);
    }, rootRef);

    return () => context.revert();
  }, [started]);

  /* Two soft lights that lean away from the pointer. Atmosphere only, so it
     stays on the aura and never moves the names themselves. */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    if (!window.matchMedia('(hover: hover) and (min-width: 900px)').matches) return undefined;

    const elena = auraElenaRef.current;
    const elvi = auraElviRef.current;
    if (!elena || !elvi) return undefined;

    const options = { duration: 1.1, ease: 'power3.out' };
    const setElenaX = gsap.quickTo(elena, 'x', options);
    const setElenaY = gsap.quickTo(elena, 'y', options);
    const setElviX = gsap.quickTo(elvi, 'x', options);
    const setElviY = gsap.quickTo(elvi, 'y', options);

    const onMove = (event) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      setElenaX(nx * 48);
      setElenaY(ny * 34);
      setElviX(nx * -48);
      setElviY(ny * -34);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  /* The hero recedes as the album takes over. */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const context = gsap.context(() => {
      gsap.to('.hero__inner', {
        yPercent: -14,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  const openAlbum = () => {
    document.getElementById('album')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section className="hero" ref={rootRef} aria-labelledby="hero-title">
      <div className="hero__aura" aria-hidden="true">
        <span className="hero__aura-blob hero__aura-blob--elena" ref={auraElenaRef} />
        <span className="hero__aura-blob hero__aura-blob--elvi" ref={auraElviRef} />
      </div>

      <div className="shell hero__inner">
        <p className="eyebrow hero__anim">Happy birthday</p>

        <h1 className="hero__names" id="hero-title">
          <span className="hero__half hero__half--elena">
            <span className="hero__word">
              <span className="hero__word-inner">Elena</span>
            </span>
            <span className="hero__mirror" aria-hidden="true">
              Elena
            </span>
          </span>

          <span className="hero__seam" aria-hidden="true" />

          <span className="hero__half hero__half--elvi">
            <span className="hero__word">
              <span className="hero__word-inner">Elvira</span>
            </span>
            <span className="hero__mirror" aria-hidden="true">
              Elvira
            </span>
          </span>
        </h1>

        <p className="hero__sub lede hero__anim">
          Everything in here is about the two of you. Take your time with it.
        </p>

        <button type="button" className="btn btn--ghost hero__cta hero__anim" onClick={openAlbum}>
          Open the album
        </button>
      </div>
    </section>
  );
}
