import "./index.css";
import App from "./App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ZenProvider } from "@umami/react-zen";
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ZenProvider colorScheme="system" palette="zinc">
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ZenProvider>
  </StrictMode>,
);