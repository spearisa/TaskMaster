import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n configuration
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';

// Set up document title
document.title = "Appmo - AI-Powered Task Management";

// Add viewport meta tag if not already present
if (!document.querySelector('meta[name="viewport"]')) {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1';
  document.head.appendChild(meta);
}

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
