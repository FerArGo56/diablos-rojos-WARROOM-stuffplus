import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LangProvider } from "./i18n";
import { AppStateProvider } from "./state";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: el service worker solo en producción (en desarrollo estorbaría a la recarga en caliente).
// Se registra de inmediato: esperar a "load" depende de que carguen las fuentes de Google.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => { /* sin HTTPS: sigue sin modo offline */ });
}
