// kick things off - entry point for the whole app
import { createRoot } from "react-dom/client";
import AppSetup from "./setup.tsx";
import "./styles.css";

// grab the root div and mount our app
const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<AppSetup />);
