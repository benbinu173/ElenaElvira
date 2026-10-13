/**
 * The room takes its colour from the visitor's clock.
 *
 * The countdown is counting to midnight, so it would be strange for the page to
 * look identical at ten in the morning and at two in the morning. The glow
 * behind everything shifts through four phases across the day. Only the
 * temperature and the strength change: gold stays gold, rose stays rose, so the
 * page never changes identity, only its hour.
 *
 * The phase is written to a data attribute on <html>, and the CSS does the
 * rest. With no JavaScript there is no attribute, and the base rule in
 * index.css is the dusk palette, which is the one the page was designed
 * around.
 */

/* Ordered by the hour each phase ends at. Anything past the last entry is
   night, which is also what the early hours fall into. */
const PHASES = [
  { endsAt: 5, phase: 'night' }, // 00:00 to 04:59
  { endsAt: 8, phase: 'dawn' }, // 05:00 to 07:59
  { endsAt: 17, phase: 'day' }, // 08:00 to 16:59
  { endsAt: 21, phase: 'dusk' }, // 17:00 to 20:59
];

export function currentPhase(date = new Date()) {
  const hour = date.getHours();
  const match = PHASES.find((entry) => hour < entry.endsAt);
  return match ? match.phase : 'night';
}

/**
 * Applies the phase now and re-checks once a minute, so a page left open
 * through midnight follows the clock rather than freezing at load time.
 * Returns a cleanup function.
 */
export function startDaylight() {
  if (typeof document === 'undefined') return undefined;

  const root = document.documentElement;
  const apply = () => {
    root.dataset.phase = currentPhase();
  };

  apply();
  const timer = window.setInterval(apply, 60000);
  return () => window.clearInterval(timer);
}
