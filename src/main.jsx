import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Wichtig: Hier wird das optimierte Tailwind geladen

/**
 * RSP KUNSTVERLAG - Einstiegspunkt
 * Diese Datei verbindet den Code mit der index.html
 */

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Kritischer Fehler: Das Element 'root' wurde nicht gefunden.");
}
