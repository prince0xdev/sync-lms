import "./index.css";
import App from "./App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ZenProvider } from "@umami/react-zen";
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import { BrowserRouter } from "react-router-dom";
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ZenProvider colorScheme="system" palette="zinc">
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
          <AuthProvider>
            <App />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ZenProvider>
  </StrictMode>,
);