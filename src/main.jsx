import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import PushNotificationProvider from "./components/PushNotificationProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <PushNotificationProvider>
        <App />
      </PushNotificationProvider>
    </LanguageProvider>
  </React.StrictMode>
);
