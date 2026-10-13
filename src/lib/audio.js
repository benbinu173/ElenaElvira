/**
 * Everything here is synthesised with the Web Audio API, so the project ships
 * with no audio files. The context is created lazily on the first real user
 * gesture, which is what browsers require anyway.
 */

let ctx = null;
let master = null;
let enabled = readPref();

function readPref() {
  try {
    return localStorage.getItem('ee-sound') !== '0';
  } catch {
    return true;
  }
}

function ensureContext() {
  if (!enabled) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = value;
  try {
    localStorage.setItem('ee-sound', value ? '1' : '0');
  } catch {
    /* storage is optional */
  }
  if (value) ensureContext();
}

/** Soft bell for a wish being made. Two partials, long decay. */
export function playChime(base = 660) {
  const audio = ensureContext();
  if (!audio) return;
  const now = audio.currentTime;

  [1, 2.01].forEach((ratio, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = base * ratio;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(index === 0 ? 0.22 : 0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 - index * 0.4);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 1.8);
  });
}

/** Short rounded blip for a balloon giving way. */
export function playPop() {
  const audio = ensureContext();
  if (!audio) return;
  const now = audio.currentTime;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420 + Math.random() * 120, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.13);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Breathed-out noise sweep, used when a candle goes out. */
export function playBlow() {
  const audio = ensureContext();
  if (!audio) return;
  const now = audio.currentTime;
  const length = Math.floor(audio.sampleRate * 0.6);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const progress = i / length;
    data[i] = (Math.random() * 2 - 1) * (1 - progress) ** 1.6;
  }

  const source = audio.createBufferSource();
  source.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(240, now + 0.55);
  filter.Q.value = 0.8;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  source.connect(filter).connect(gain).connect(master);
  source.start(now);
  source.stop(now + 0.62);
}

/* --------------------------------------------------------------------------
   The tune.

   Notes are given as frequencies so the melody below can be read as sheet
   music rather than as a wall of numbers. Equal temperament, A4 = 440.
   -------------------------------------------------------------------------- */

const G4 = 392.0;
const A4 = 440.0;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const F5 = 698.46;
const G5 = 783.99;

/** One soft bell, struck at `at` and left to decay on its own. */
function ring(freq, at, duration = 1.1, level = 0.12) {
  if (!ctx || !master) return;

  [1, 2.01].forEach((ratio, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = (index === 0 ? 1 : 0.32) * level;
    const decay = index === 0 ? duration : duration * 0.6;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);

    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  });
}

/**
 * Happy Birthday, on the same bell voice as everything else on the page.
 *
 * It quotes the actual tune rather than inventing something in the same mood.
 * The melody has been public domain in the United States since 2016, and the
 * recognisable version is the one that lands: on the birthday page the whole
 * point is that they know what is coming after the second note.
 */
export function playBirthday() {
  const audio = ensureContext();
  if (!audio) return;

  const BEAT = 0.42;
  const start = audio.currentTime + 0.08;

  /* [frequency, length in beats]. The long final note of each phrase is the
     dotted rhythm, and it is what makes the tune unmistakable rather than
     merely recognisable. */
  const MELODY = [
    [G4, 0.5], [G4, 0.5], [A4, 1], [G4, 1], [C5, 1], [B4, 1.8],
    [G4, 0.5], [G4, 0.5], [A4, 1], [G4, 1], [D5, 1], [C5, 1.8],
    [G4, 0.5], [G4, 0.5], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 1.8],
    [F5, 0.5], [F5, 0.5], [E5, 1], [C5, 1], [D5, 1], [C5, 2.4],
  ];

  let at = start;
  MELODY.forEach(([freq, beats]) => {
    const held = beats * BEAT;
    ring(freq, at, Math.max(held * 1.5, 0.5));
    at += held;
  });
}
