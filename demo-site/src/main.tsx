import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { DemoApp } from './DemoApp';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoApp />
    <Analytics />
  </StrictMode>,
);
