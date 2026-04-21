import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as Sentry from "@sentry/react";

// 1. Initialize Sentry FIRST, before React does anything
Sentry.init({
  // It is much safer to use the environment variable like we set up in Vercel!
  // But if you want to hardcode it for now, you can leave your URL here:
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://a7c0e7622c5e2b75e0f9b598423bee88@o4511258948075520.ingest.de.sentry.io/4511258949648464",
  
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  sendDefaultPii: true
});

// 2. Render the app exactly ONCE
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);