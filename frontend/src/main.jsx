// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// --- Importaciones de CSS globales: ¡Solo aquí! ---
import './assets/css/base.css';
import './assets/css/styles.css'; // Contiene estilos de secciones, footer, etc.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);