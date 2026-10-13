import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap.js';
import './chrome.css';

/** A hairline gold rule at the very top showing how far down the album goes. */
export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.35 },
        }
      );
    });

    return () => context.revert();
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <span className="progress__bar" ref={barRef} />
    </div>
  );
}
