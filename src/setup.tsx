// setting up all the routing and stuff
import { PopupMessages } from "@/bits/popup-messages";
import { Toaster as QuickMessages } from "@/components/user-interface/sonner";
import { TooltipProvider } from "@/components/user-interface/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./views/LandingPage";
import ModelTrainer from "./views/ModelTrainer";
import StatsLab from "./views/StatsLab";
import NotFound from "./views/NotFound";

// gotta have react query for fetching stuff
const queryClient = new QueryClient();

const AppSetup = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* notifications and toasts */}
      <PopupMessages />
      <QuickMessages />
      
      {/* pages */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/train-model" element={<ModelTrainer />} />
          <Route path="/analyze-data" element={<StatsLab />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppSetup;
