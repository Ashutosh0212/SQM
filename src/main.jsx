import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/quotation.css';

/** Letterhead in public/ — use ASCII filename (no spaces) for reliable GitHub Pages + CSS. */
const letterheadPath = `${import.meta.env.BASE_URL}letterhead-a4.png`;
document.documentElement.style.setProperty(
  '--quot-letterhead',
  `url("${letterheadPath}")`
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
