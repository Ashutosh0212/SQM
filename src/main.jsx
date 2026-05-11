import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/quotation.css';

/** Letterhead in public/ — path must follow Vite `base` (e.g. GitHub Pages subpath). */
document.documentElement.style.setProperty(
  '--quot-letterhead',
  `url(${import.meta.env.BASE_URL}Shivatronics letterhead A4.png)`
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
