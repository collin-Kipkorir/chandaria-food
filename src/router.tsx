// The project has migrated to react-router-dom for client routing.
// This module kept a getRouter helper for TanStack react-router. To keep
// generated type imports intact (routeTree.gen.ts), export a placeholder
// that will throw if used at runtime. The app now uses react-router-dom.

// During migration away from TanStack Router some dev tools / generated code
// may still import `getRouter`. Return a tolerant, chainable stub instead of
// throwing so those tools don't crash at runtime. The app itself now uses
// react-router-dom for client routing.
const createStub = (): any => {
  // A callable proxy that returns itself for any property access or call.
  let proxy: any;
  const fn = function () {
    return proxy;
  } as any;

  proxy = new Proxy(fn, {
    get: () => proxy,
    apply: () => proxy,
    construct: () => proxy,
  });

  return proxy;
};

export const getRouter = () => {
  console.warn('getRouter() called: returning a stub router because TanStack router was removed.');
  return createStub();
};
