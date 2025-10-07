import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug logging
console.log("Main.tsx loaded");
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  console.log("Creating React root and rendering App...");
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering App:", error);
  }
} else {
  console.error("Root element not found!");
}
