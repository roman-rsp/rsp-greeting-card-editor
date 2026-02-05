import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Wichtig: Hiermit laden wir das optimierte Tailwind-CSS

/**
 * RSP KUNSTVERLAG - Start-Logik
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
  console.error("Kritischer Fehler: Das Element mit der ID 'root' wurde nicht gefunden.");
}
