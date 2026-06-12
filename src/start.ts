import { renderErrorPage } from "./lib/error-page";

// Stub startInstance to preserve the shape used in generated types. This
// avoids pulling @tanstack/react-start at runtime while we migrate.
export const startInstance = {
  async getOptions() {
    return {
      requestMiddleware: [],
    };
  },
  // Keep a placeholder in case other modules call startInstance in runtime.
};
