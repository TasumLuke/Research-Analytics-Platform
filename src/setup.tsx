// wire up all the providers and routing stuff
import { PopupMessages } from "@/bits/popup-messages";
import { Toaster as QuickMessages } from "@/components/user-interface/sonner";
import { TooltipProvider } from "@/components/user-interface/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./views/LandingPage";
import ModelTrainer from "./views/ModelTrainer";
import StatsLab from "./views/StatsLab";
import NotFound from "./views/NotFound";

// set up react query for data fetching
const dataClient = new QueryClient();

const AppSetup = () => (
  <QueryClientProvider client={dataClient}>
    <TooltipProvider>
      {/* popup notification systems */}
      <PopupMessages />
      <QuickMessages />
      
      {/* main routing */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/train-model" element={<ModelTrainer />} />
          <Route path="/analyze-data" element={<StatsLab />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppSetup;
