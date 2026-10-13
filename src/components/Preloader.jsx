import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, EASE } from '../lib/gsap.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { burstAt } from '../lib/confetti.js';
import { photos } from '../data/photos.js';
import './preloader.css';

/**
 * The invitation. It doubles as a real preloader: the photos on the wall are
 * fetched while this is on screen, and the line under the button is genuinely
 * reporting that progress rather than performing it.
 */
export default function Preloader({ onStart, onFinished, onReady }) {
  const rootRef = useRef(null);
  const panelTopRef = useRef(null);
  const panelBottomRef = useRef(null);
  const contentRef = useRef(null);
  const barRef = useRef(null);
  const buttonRef = useRef(null);

  const [ready, setReady] = useState(false);
  const leavingRef = useRef(false);

  /* Preload every photo behind the gate. */
  useEffect(() => {
    let cancelled = false;
    let done = 0;
    const total = Math.max(photos.length, 1);

    const report = () => {
      if (cancelled) return;
      done += 1;
      const ratio = Math.min(done / total, 1);
      if (barRef.current) {
        gsap.to(barRef.current, { scaleX: ratio, duration: 0.5, ease: EASE.soft });
      }
      if (done >= total) {
        setReady(true);
        onReady?.();
      }
    };

    if (!photos.length) {
      setReady(true);
      onReady?.();
      return undefined;
    }

    photos.forEach((photo) => {
      const img = new Image();
      img.onload = report;
      img.onerror = report;
      img.src = photo.src;
    });

    return () => {
      cancelled = true;
    };
  }, [onReady]);

  const open = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    onStart?.();

    const reduced = prefersReducedMotion();

    if (reduced) {
      gsap.set([panelTopRef.current, panelBottomRef.current], { display: 'none' });
      onFinished?.();
      return;
    }

    const timeline = gsap.timeline({ onComplete: () => onFinished?.() });

    timeline
      .to(contentRef.current, { opacity: 0, y: -24, duration: 0.45, ease: EASE.soft })
      .to(
        panelTopRef.current,
        { yPercent: -101, duration: 1.15, ease: 'power4.inOut' },
        0.2
      )
      .to(
        panelBottomRef.current,
        { yPercent: 101, duration: 1.15, ease: 'power4.inOut' },
        0.2
      );

    // The burst lands as the gap between the panels opens, so the confetti
    // reads as coming through the door rather than sitting behind it.
    setTimeout(() => {
      burstAt(window.innerWidth / 2, window.innerHeight / 2, {
        count: 70,
        power: 17,
        scale: 1.1,
      });
    }, 700);
  }, [onStart, onFinished]);

  /* Escape skips the ceremony for anyone who wants the page immediately. */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && ready) open();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, open]);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className="gate" ref={rootRef} role="dialog" aria-modal="true" aria-label="Open your present">
      <div className="gate__panel gate__panel--top" ref={panelTopRef} aria-hidden="true" />
      <div className="gate__panel gate__panel--bottom" ref={panelBottomRef} aria-hidden="true" />

      <div className="gate__content" ref={contentRef}>
        <p className="gate__for">For Elena and Elvira</p>

        <h1 className="gate__title display">
          Someone made you
          <br />
          something.
        </h1>

        {/* The count is read rather than written, so adding a photo does not
            leave the invitation telling a small lie. */}
        <p className="gate__sub">
          {photos.length} photographs, two candles, and one very long scroll. Take it slowly.
        </p>

        <button type="button" className="btn btn--solid gate__button" onClick={open} ref={buttonRef}>
          {ready ? 'Open it' : 'Getting it ready'}
        </button>

        <div className="gate__meter" aria-hidden="true">
          <span className="gate__meter-fill" ref={barRef} />
        </div>

        <p className="gate__hint">
          {ready ? 'Press Escape to skip ahead' : `Loading ${photos.length} photographs`}
        </p>
      </div>
    </div>
  );
}
