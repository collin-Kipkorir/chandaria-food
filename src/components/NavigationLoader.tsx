import React, { createContext, useCallback, useContext, useState } from "react";

const NavigationLoaderContext = createContext<{
  start: () => void;
  done: () => void;
}>({
  start: () => {},
  done: () => {},
});

export function NavigationLoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => setLoading(true), []);
  const done = useCallback(() => setLoading(false), []);

  return (
    <NavigationLoaderContext.Provider value={{ start, done }}>
      {loading && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1">
          <div className="h-1 w-full animate-progress bg-gradient-to-r from-brand-gold via-brand-gold-dark to-brand-gold" />
        </div>
      )}
      {children}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent border-white/90" />
        </div>
      )}
    </NavigationLoaderContext.Provider>
  );
}

export function useNavigationLoader() {
  return useContext(NavigationLoaderContext);
}
