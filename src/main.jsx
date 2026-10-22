import React from 'react';
import { createRoot } from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App.jsx';
import './styles/global.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker for Vite/Electron
import workerSrc from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
