import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * RSP KUNSTVERLAG - Start-Logik
 * Wir fügen einen Console-Log hinzu, um zu sehen, ob die Datei überhaupt geladen wird.
 */
console.log("React-App: Initialisierung wird gestartet...");

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React-App: Rendering erfolgreich angestoßen.");
} else {
  console.error("Kritischer Fehler: Das Element 'root' wurde nicht gefunden.");
}
