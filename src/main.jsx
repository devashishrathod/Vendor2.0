import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./config/firebase.js";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { installSessionEndHandler } from "./features/onboarding/utils/sessionEnd";
import { purgeLegacyStorage } from "./utils/legacyStorage";

purgeLegacyStorage();
installSessionEndHandler();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
