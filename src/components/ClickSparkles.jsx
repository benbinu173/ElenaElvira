import { useEffect } from 'react';
import { sparkle } from '../lib/confetti.js';

/**
 * Feedback on tap. Not a custom cursor: the system pointer stays exactly as the
 * user expects it, this only adds embers at the point of contact.
 */
export default function ClickSparkles() {
  useEffect(() => {
    const onPointerDown = (event) => {
      sparkle(event.clientX, event.clientY);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return null;
}
