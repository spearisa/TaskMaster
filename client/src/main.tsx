import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set up document title
document.title = "TaskFlow - Smart Task Management";

// Add viewport meta tag if not already present
if (!document.querySelector('meta[name="viewport"]')) {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1';
  document.head.appendChild(meta);
}

createRoot(document.getElementById("root")!).render(<App />);
