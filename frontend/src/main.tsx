import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as Sentry from "@sentry/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
Sentry.init({
  dsn: "https://a7c0e7622c5e2b75e0f9b598423bee88@o4511258948075520.ingest.de.sentry.io/4511258949648464",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);