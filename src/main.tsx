import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver loop error
const consoleError = console.error;
console.error = (...args: any) => {
  if (args[0]?.includes?.('ResizeObserver loop')) {
    return;
  }
  consoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
