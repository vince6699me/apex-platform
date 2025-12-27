
import React, { useState } from "react";
import { Toaster, TooltipProvider } from "./components/ui/primitives";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { AIAssistantPanel } from "./components/AI/AIAssistantPanel";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Watchlist from "./pages/Watchlist";
import TechnicalAnalysis from "./pages/TechnicalAnalysis";
import Charts from "./pages/Charts";
import RiskManagement from "./pages/RiskManagement";
import AIIntelligence from "./pages/AIIntelligence";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import TradingIntelligence from "./pages/TradingIntelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <div className="flex h-screen overflow-hidden bg-background relative">
            <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out" style={{ marginRight: isAIPanelOpen ? '320px' : '0' }}>
              <Header onToggleAI={() => setIsAIPanelOpen(!isAIPanelOpen)} />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/technical-analysis" element={<TechnicalAnalysis />} />
                  <Route path="/charts" element={<Charts />} />
                  <Route path="/risk" element={<RiskManagement />} />
                  <Route path="/ai" element={<AIIntelligence />} />
                  <Route path="/trading-intelligence" element={<TradingIntelligence />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            
            {/* AI Panel sits outside the flex layout to be fixed on right */}
            <AIAssistantPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />
          </div>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
