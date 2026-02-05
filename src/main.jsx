import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

/**
 * RSP KUNSTVERLAG - Start-Logik
 * Diese Datei verbindet den React-Code mit der index.html.
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
  console.error("Fehler: Das HTML-Element 'root' wurde nicht gefunden.");
}
