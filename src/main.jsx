import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { startDaylight } from './lib/daylight.js';
import './styles/index.css';

// Elements that animate in start hidden in CSS. That rule is scoped to
// `html.js` so the page still renders if the bundle never executes.
document.documentElement.classList.add('js');

// Sets the hour on <html>. The glow behind the page is styled from it.
startDaylight();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
