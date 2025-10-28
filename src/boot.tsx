// just booting up the app here
import { createRoot } from "react-dom/client";
import AppSetup from "./setup.tsx";
import "./styles.css";

// find that div and render everything
const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<AppSetup />);
