import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  redirect,
  useFetcher,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import stylesheet from "~/styles/index.css?url";
import { AuthProvider } from "~/context/auth.context";
import { AppLayout } from "~/components/layout/AppLayout";
import { isAuthenticated } from "./services/session.server";
import { getUserProfile } from "./services/auth.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const loggedIn = await isAuthenticated(request);

  let user = null;
  if (loggedIn) {
    try {
      const profile = await getUserProfile(request);
      user = profile.admin ?? null;
    } catch(error) {
      if (error instanceof Response) {
        // Check if it's a redirect (status 302, 303, 307, 308) or any 3xx status
        if (error.status >= 300 && error.status < 400) {
          throw error;
        }
      }
      user = null;
    }
  }

  return {
    isLoggedIn: loggedIn && !!user,
    user,
    isLoaded: true,
  };
};

export default function App() {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Softborn Admin Portal</title>
        <Meta />
        <Links />
      </head>
      <body>
        <AuthProvider>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Softborn Admin</title>
        <Links />
      </head>
      <body className="bg-admin-bg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-admin-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isRouteErrorResponse(error)
                ? `${error.status} ${error.statusText}`
                : "Something went wrong"}
            </h1>
            <p className="text-admin-muted mb-6">
              {isRouteErrorResponse(error)
                ? error.data?.message || error.data
                : error instanceof Error
                  ? error.message
                  : "An unexpected error occurred"}
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="/"
                className="px-5 py-2.5 bg-admin-primary text-white rounded-lg font-medium text-sm hover:bg-admin-primary-hover transition-colors"
              >
                Go Home
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-admin-bg text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
