import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap, EASE } from '../lib/gsap.js';
import { prefersReducedMotion, useScrollLock } from '../lib/motion.js';
import './lightbox.css';

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen view of a single print.
 *
 * Rendered through a portal so it is never trapped inside a pinned, transformed
 * section, and so the fixed positioning is guaranteed to mean the viewport.
 */
export default function Lightbox({ photos, index, onClose, onNavigate }) {
  const dialogRef = useRef(null);
  const stageRef = useRef(null);
  const scrimRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  const total = photos.length;
  const photo = photos[index];

  useScrollLock(true);

  const go = useCallback(
    (step) => {
      onNavigate((index + step + total) % total);
    },
    [index, total, onNavigate]
  );

  /* Remember who opened this, so focus can go back there on close. */
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      const node = returnFocusRef.current;
      if (node && typeof node.focus === 'function') node.focus();
    };
  }, []);

  /* Scrim fade, once. */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(
      scrimRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.45, ease: 'none' }
    );
    return () => tween.kill();
  }, []);

  /* Print swap. Also runs on first paint so the image arrives rather than
     blinking into place. */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(
      stageRef.current,
      { autoAlpha: 0, y: 20, scale: 0.975 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.out }
    );
    return () => tween.kill();
  }, [index]);

  /* Warm the neighbours so arrow keys feel instant. */
  useEffect(() => {
    [1, -1].forEach((step) => {
      const neighbour = photos[(index + step + total) % total];
      if (!neighbour) return;
      const img = new Image();
      img.src = neighbour.src;
    });
  }, [index, photos, total]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || []);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const onScrimDown = (event) => {
    if (event.target === scrimRef.current) onClose();
  };

  return createPortal(
    <div
      className="lightbox"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${total}`}
    >
      <div className="lightbox__scrim" ref={scrimRef} onMouseDown={onScrimDown} />

      <div className="lightbox__stage" ref={stageRef}>
        <figure className="lightbox__figure">
          <img src={photo.src} alt={photo.alt} draggable="false" />
          <figcaption className="lightbox__caption hand">{photo.caption}</figcaption>
        </figure>
      </div>

      <button type="button" className="lightbox__close dark-ui" ref={closeRef} onClick={onClose}>
        Close
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev dark-ui"
            onClick={() => go(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next dark-ui"
            onClick={() => go(1)}
          >
            Next
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
