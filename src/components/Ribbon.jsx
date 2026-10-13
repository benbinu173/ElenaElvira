import './ribbon.css';

const LINES = [
  'Happy birthday Elena',
  'Happy birthday Elvira',
  'Happy birthday Elena',
  'Happy birthday Elvira',
];

/**
 * The one marquee on the page. It separates the countdown from the album and
 * does the job a title would do, without needing a title.
 *
 * Decorative repetition, so it is hidden from assistive tech: both names are
 * already announced properly in the hero heading.
 */
export default function Ribbon() {
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon__inner">
        {[0, 1].map((copy) => (
          <div className="ribbon__track" key={copy}>
            {LINES.map((line, index) => (
              <span className="ribbon__item" key={`${copy}-${index}`}>
                <span className={`ribbon__text tone-${index % 2 === 0 ? 'gold' : 'rose'}`}>
                  {line}
                </span>
                <span className="ribbon__sep" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
