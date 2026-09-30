import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/instrument-sans/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { StoreProvider } from './state/store';
import { ToastProvider } from './state/toast';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ToastProvider>
  </StrictMode>,
);
