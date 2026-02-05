import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // WICHTIG: Hier laden wir die Tailwind-Direktiven

/**
 * RSP KUNSTVERLAG - Start-Logik
 * Diese Datei verbindet den React-Code mit der index.html
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
  console.error("Kritischer Fehler: Das Element mit der ID 'root' wurde nicht gefunden.");
}
