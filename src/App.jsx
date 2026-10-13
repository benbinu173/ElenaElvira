import { useCallback, useEffect, useState } from 'react';

import Preloader from './components/Preloader.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import AmbientParticles from './components/AmbientParticles.jsx';
import ClickSparkles from './components/ClickSparkles.jsx';
import SoundToggle from './components/SoundToggle.jsx';

import Hero from './components/Hero.jsx';
import Countdown from './components/Countdown.jsx';
import Turns from './components/Turns.jsx';
import Together from './components/Together.jsx';
import Ribbon from './components/Ribbon.jsx';
import GalleryWall from './components/GalleryWall.jsx';
import ThenNow from './components/ThenNow.jsx';
import Candles from './components/Candles.jsx';
import Notes from './components/Notes.jsx';
import Finale from './components/Finale.jsx';
import Footer from './components/Footer.jsx';

import { isSoundEnabled, setSoundEnabled } from './lib/audio.js';
import { queueRefresh } from './lib/gsap.js';
import { photos } from './data/photos.js';

const OPENED_KEY = 'ee-opened';

export default function App() {
  // Returning to the page in the same session skips the invitation and goes
  // straight to the reveal they have already seen once.
  const [gateMounted, setGateMounted] = useState(() => {
    try {
      return sessionStorage.getItem(OPENED_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [started, setStarted] = useState(() => !gateMounted);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);

  useEffect(() => {
    if (!started) return;
    try {
      sessionStorage.setItem(OPENED_KEY, '1');
    } catch {
      /* storage is optional */
    }
  }, [started]);

  const handleStart = useCallback(() => setStarted(true), []);
  const handleFinished = useCallback(() => setGateMounted(false), []);

  const toggleSound = useCallback(() => {
    setSoundOn((current) => {
      const next = !current;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  return (
    <div className="app">
      <div className="glow-field" aria-hidden="true" />
      <AmbientParticles />
      <div className="grain" aria-hidden="true" />

      <ScrollProgress />

      <main id="top">
        <Hero started={started} />
        <Countdown />
        <Turns />
        <Together />
        <Ribbon />
        <GalleryWall />
        <ThenNow />
        <Candles />
        <Notes />
        <Finale />
        <Footer />
      </main>

      <ClickSparkles />

      {started && <SoundToggle on={soundOn} onToggle={toggleSound} />}

      {gateMounted && (
        <Preloader
          photoCount={photos.length}
          onStart={handleStart}
          onFinished={handleFinished}
          onReady={queueRefresh}
        />
      )}
    </div>
  );
}
