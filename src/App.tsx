
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/web3Config";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create a buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    from: (data: string) => new Uint8Array(
      data.split('').map(char => char.charCodeAt(0))
    ),
  } as any;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiConfig config={wagmiConfig}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WagmiConfig>
  </QueryClientProvider>
);

export default App;
