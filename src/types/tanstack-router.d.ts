declare module '@tanstack/react-router' {
  // Minimal stubs used in this project to avoid type errors during development
  export const Outlet: any;
  export function createFileRoute<P = any>(path: string): (config?: any) => {
    useParams: <T = P>() => T;
  };
  export function createRootRouteWithContext<T = any>(...args: any[]): any;
  export function useRouter(): any;
  export const HeadContent: any;
  export const Scripts: any;
  export const Link: any;
  export const Route: any;
  export function useMatch(): any;
  export function useNavigate(): any;
  export function useParams(): any;
  export function useLocation(): any;
}
