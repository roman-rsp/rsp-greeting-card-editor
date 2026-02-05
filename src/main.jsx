import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

/**
 * RSP KUNSTVERLAG - Start-Logik
 * Hier wird die CSS-Datei geladen, die das CDN ersetzt.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
