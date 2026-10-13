import { useEffect, useRef, useState } from 'react';
import { gsap, queueRefresh } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { burstFromElement } from '../lib/confetti.js';
import { playChime } from '../lib/audio.js';
import { photos, DEVELOP_PHOTO } from '../data/photos.js';
import Lightbox from './Lightbox.jsx';
import './gallery.css';

/* Deterministic tilts and lifts so the wall reads as hand-placed rather than
   machine-aligned, without re-shuffling on every render. */
const TILTS = [-3.4, 2.6, -1.8, 3.8, -2.9, 1.6, -3.9, 2.2, -1.4, 3.2, -2.4, 2.9];
const LIFTS = [18, -26, 34, -12, 26, -34, 8, -20, 30, -6, 22, -28];

const DEVELOP_INDEX = photos.findIndex((photo) => photo.name === DEVELOP_PHOTO);

/**
 * Holding a print down only makes sense with a pointer that can hover. On a
 * touch screen a long press is how you scroll a horizontal strip, so phones get
 * the photograph immediately instead. Decided once, before the first paint, so
 * the blank never flashes over a photograph that was already there.
 */
function canDevelop() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function GalleryWall() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const developRef = useRef(null);
  const developStartRef = useRef(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [developed, setDeveloped] = useState(false);
  const [developable] = useState(canDevelop);

  const developVisible = developable && DEVELOP_INDEX !== -1;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const media = gsap.matchMedia();

    media.add(
      {
        isDesktop: '(min-width: 900px)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (self) => {
        const { isDesktop, reduced } = self.conditions;

        revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
          trigger: section,
          stagger: 0.06,
        });

        /* The pan only exists on a wide screen with motion allowed. Everything
           else falls back to the natively scrollable strip in gallery.css. */
        if (!isDesktop || reduced) return;

        const pin = pinRef.current;
        const track = trackRef.current;
        if (!pin || !track) return;

        const cards = gsap.utils.toArray(section.querySelectorAll('.postcard'));
        const rail = section.querySelector('.wall__rail-fill');
        const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
        const span = () => `+=${distance() + window.innerHeight * 0.35}`;

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: span,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /* Prints drift at different rates so the row never reads as one rigid
           strip being dragged sideways. */
        gsap.to(cards, {
          y: (index) => (index % 2 ? -58 : 58),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: span,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        if (rail) {
          gsap.fromTo(
            rail,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: pin,
                start: 'top top',
                end: span,
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      },
      section
    );

    return () => media.revert();
  }, []);

  /* The blank print, kept out of the effect above because it has nothing to do
     with scrolling and must not be torn down and rebuilt every time the
     breakpoint changes.

     `mode` is the whole state machine: null when idle, 'hold' while a pointer
     is down, 'auto' while a keyboard-triggered develop runs, 'done' forever
     after. Only 'hold' can be interrupted, which is what makes a quick click
     leave the print as it was. */
  useEffect(() => {
    const card = developRef.current;
    if (!card) return undefined;

    const blank = card.querySelector('.postcard__blank');
    if (!blank) return undefined;

    let mode = null;
    let tween = null;

    const finish = () => {
      mode = 'done';
      setDeveloped(true);
      playChime(659.25);
      burstFromElement(card, { count: 18, power: 7, scale: 0.8 });
    };

    const begin = (auto) => {
      if (mode === 'done' || mode === 'auto') return;
      mode = auto ? 'auto' : 'hold';
      tween?.kill();
      tween = gsap.to(blank, { autoAlpha: 0, duration: 2.2, ease: 'none', onComplete: finish });
    };

    const release = () => {
      if (mode !== 'hold') return;
      mode = null;
      tween?.kill();
      tween = gsap.to(blank, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' });
    };

    const onDown = (event) => {
      if (event.button !== 0) return;
      begin(false);
    };

    /* A long press on an image raises the context menu on some platforms,
       which would cancel the hold halfway through. */
    const onMenu = (event) => event.preventDefault();

    card.addEventListener('pointerdown', onDown);
    card.addEventListener('contextmenu', onMenu);
    card.addEventListener('pointerleave', release);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    /* Registered so the card's click handler can reach it: a keyboard has no
       way to hold something down, so its activation just develops the print. */
    developStartRef.current = () => begin(true);

    return () => {
      tween?.kill();
      developStartRef.current = null;
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('contextmenu', onMenu);
      card.removeEventListener('pointerleave', release);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  const count = photos.length;

  return (
    <section className="wall" id="album" ref={sectionRef} aria-labelledby="wall-title">
      <div className="shell wall__head">
        <div className="section-head">
          <h2 id="wall-title" data-reveal>
            Things we never deleted
          </h2>
          <p className="lede" data-reveal>
            Every one of these is still on somebody&apos;s phone. Open any print to see it properly.
          </p>
        </div>
      </div>

      {count === 0 ? (
        <div className="shell">
          <p className="lede">
            No photographs found. Put some images in <code>src/assets/photos</code> and they will
            appear here on their own.
          </p>
        </div>
      ) : (
        <div className="wall__pin" ref={pinRef}>
          <div className="wall__track" ref={trackRef}>
            {photos.map((photo, index) => {
              const isDevelop = developVisible && index === DEVELOP_INDEX;
              const ready = !isDevelop || developed;

              return (
                <figure
                  className="postcard"
                  key={photo.name}
                  ref={isDevelop ? developRef : undefined}
                  style={{
                    '--tilt': `${TILTS[index % TILTS.length]}deg`,
                    '--lift': `${LIFTS[index % LIFTS.length]}px`,
                  }}
                >
                  <button
                    type="button"
                    className="postcard__button"
                    onClick={(event) => {
                      if (!ready) {
                        /* A click that came from a keyboard arrives with a zero
                           detail count and cannot be held, so it develops the
                           print outright rather than doing nothing at all. */
                        if (event.detail === 0) developStartRef.current?.();
                        return;
                      }
                      setOpenIndex(index);
                    }}
                    aria-label={
                      ready
                        ? `Open photograph: ${photo.alt}`
                        : 'Hold this print down to develop it'
                    }
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      onLoad={queueRefresh}
                    />

                    {isDevelop && (
                      <span className="postcard__blank" aria-hidden="true">
                        <span className="postcard__blank-hint">Hold to develop</span>
                      </span>
                    )}
                  </button>

                  <figcaption className="postcard__caption hand">{photo.caption}</figcaption>
                </figure>
              );
            })}
          </div>

          <div className="wall__rail" aria-hidden="true">
            <span className="wall__rail-fill" />
          </div>
        </div>
      )}

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </section>
  );
}
