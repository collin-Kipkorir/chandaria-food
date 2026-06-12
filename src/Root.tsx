import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MaintenanceGate } from "./components/MaintenanceGate";
import { Toaster } from "./components/ui/sonner";
import AppRoutes from "./AppRoutes";
import { startFirebaseSync } from "./lib/store";
import { isFirebaseConfigured } from "./lib/firebase";
import { NavigationLoaderProvider } from "./components/NavigationLoader";

const queryClient = new QueryClient();

export default function Root() {
  useEffect(() => {
    startFirebaseSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!isFirebaseConfigured && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
          Firebase Realtime DB not configured — running on local fallback.
        </div>
      )}
      <NavigationLoaderProvider>
        <MaintenanceGate>
          <AppRoutes />
        </MaintenanceGate>
      </NavigationLoaderProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
