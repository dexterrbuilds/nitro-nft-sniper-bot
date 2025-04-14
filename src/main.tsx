
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    from: (data: string) => new Uint8Array(
      data.split('').map(char => char.charCodeAt(0))
    ),
  } as any;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
