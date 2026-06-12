import { type ReactNode } from "react";

// Stub for backward compatibility with TanStack file-router structure.
// Client routing is now handled by react-router-dom in src/main.tsx and src/Root.tsx.

export function Root({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
