import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Vite removes this import and the fixture UI entirely from production builds.
const Root = import.meta.env.DEV && window.location.pathname === "/__living-core"
  ? React.lazy(() => import("./dev/LivingCorePreview"))
  : App;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}><Root /></React.Suspense>
  </React.StrictMode>,
);
