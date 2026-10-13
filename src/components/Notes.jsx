import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap.js';
import { revealOnScroll } from '../lib/anim.js';
import { drift } from '../lib/confetti.js';
import { playChime } from '../lib/audio.js';
import { seededNotes, EMPTY_NOTE, SHARE_TO } from '../data/wishes.js';
import './notes.css';

const STORAGE_KEY = 'ee-notes-v1';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => n && n.text) : [];
  } catch {
    return [];
  }
}

function saveStored(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* storage is optional */
  }
}

/** Stable per-note tilt so the board does not reshuffle between renders. */
function tiltFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return ((hash % 9) - 4) * 0.85;
}

/**
 * A board for notes from everyone else. Locally written notes live in
 * localStorage on this device and never leave it, which is stated plainly in
 * the copy so nobody expects them to travel.
 */
export default function Notes() {
  const rootRef = useRef(null);
  const boardRef = useRef(null);
  const [mine, setMine] = useState(loadStored);
  const [from, setFrom] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const section = rootRef.current;
    if (!section) return undefined;

    const context = gsap.context(() => {
      revealOnScroll(gsap.utils.toArray(section.querySelectorAll('[data-reveal]')), {
        trigger: section,
        stagger: 0.07,
      });
    }, section);

    return () => context.revert();
  }, []);

  const notes = [...seededNotes, ...mine];

  /* A note pinned here never leaves this browser, so it reaches nobody. These
     links hand it to whatever the visitor already uses to send things, which is
     the only route a note has to actually arrive. Built only from what has been
     typed, and only rendered when there is something to send. */
  const shareTargets = [];
  const draft = text.trim();

  if (draft) {
    const signed = from.trim() ? `${from.trim()} wrote:` : 'Someone wrote:';
    const body = `${signed}\n\n${draft}\n\nFor Elena and Elvira, on the twenty-second.`;

    if (SHARE_TO.email) {
      shareTargets.push({
        key: 'email',
        label: 'Email it to me',
        href: `mailto:${SHARE_TO.email}?subject=${encodeURIComponent(
          'A note for Elena and Elvira'
        )}&body=${encodeURIComponent(body)}`,
      });
    }

    if (SHARE_TO.whatsapp) {
      shareTargets.push({
        key: 'whatsapp',
        label: 'WhatsApp it to me',
        href: `https://wa.me/${SHARE_TO.whatsapp}?text=${encodeURIComponent(body)}`,
        external: true,
      });
    }
  }

  const submit = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = text.trim();

      if (!trimmed) {
        setError('Write something first, even just a line.');
        return;
      }
      if (trimmed.length > 400) {
        setError('That is a little long for a note. Keep it under 400 characters.');
        return;
      }

      setError('');
      const note = {
        id: `local-${Date.now()}`,
        from: from.trim() || 'Someone',
        text: trimmed,
      };

      const next = [...mine, note];
      setMine(next);
      saveStored(next);
      setFrom('');
      setText('');

      playChime(880);
      drift(2200);

      // The new note drops onto the board rather than just appearing.
      requestAnimationFrame(() => {
        const node = boardRef.current?.querySelector(`[data-note="${note.id}"]`);
        if (!node) return;
        gsap.from(node, {
          y: -34,
          autoAlpha: 0,
          rotate: tiltFor(note.id) - 6,
          duration: 0.9,
          ease: 'expo.out',
        });
      });
    },
    [from, text, mine]
  );

  const remove = (id) => {
    const next = mine.filter((note) => note.id !== id);
    setMine(next);
    saveStored(next);
  };

  return (
    <section className="notes section" ref={rootRef} aria-labelledby="notes-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="notes-title" data-reveal>
            Leave them a note
          </h2>
          <p className="lede" data-reveal>
            Anything you want them to read on the day. Notes you write here stay on this device and
            nowhere else.
          </p>
        </div>

        <div className="notes__layout">
          <form className="notes__form" onSubmit={submit} data-reveal noValidate>
            <div className="field">
              <label htmlFor="note-from">Your name</label>
              <input
                id="note-from"
                type="text"
                value={from}
                maxLength={40}
                placeholder="Optional"
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="note-text">Your note</label>
              <textarea
                id="note-text"
                rows={4}
                value={text}
                maxLength={400}
                placeholder="Something you would want them to read on the twenty-second."
                aria-describedby={error ? 'note-error' : 'note-help'}
                aria-invalid={error ? 'true' : 'false'}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError('');
                }}
              />
              {error ? (
                <p className="field__error" id="note-error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="field__help" id="note-help">
                  {400 - text.length} characters left
                </p>
              )}
            </div>

            <button type="submit" className="btn btn--solid">
              Pin it to the board
            </button>

            {shareTargets.length > 0 && (
              <div className="notes__send">
                <p className="notes__send-label">
                  A pinned note only lives in your browser. To be sure they read it, send it my way
                  and I will pass it on:
                </p>
                <div className="notes__send-actions">
                  {shareTargets.map((target) => (
                    <a
                      key={target.key}
                      className="notes__send-link"
                      href={target.href}
                      target={target.external ? '_blank' : undefined}
                      rel={target.external ? 'noreferrer' : undefined}
                    >
                      {target.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </form>

          <div className="notes__board" ref={boardRef} data-reveal>
            {notes.length === 0 ? (
              <div className="notes__empty">
                <p className="notes__empty-title hand">{EMPTY_NOTE.title}</p>
                <p className="notes__empty-body">{EMPTY_NOTE.body}</p>
              </div>
            ) : (
              <ul className="notes__list">
                {notes.map((note) => {
                  const isMine = note.id.startsWith('local-');
                  return (
                    <li
                      className="note"
                      key={note.id}
                      data-note={note.id}
                      style={{ '--tilt': `${tiltFor(note.id)}deg` }}
                    >
                      <span className="note__pin" aria-hidden="true" />
                      <p className="note__text hand">{note.text}</p>
                      <p className="note__from">{note.from}</p>
                      {isMine && (
                        <button
                          type="button"
                          className="note__remove"
                          onClick={() => remove(note.id)}
                          aria-label={`Remove the note from ${note.from}`}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
