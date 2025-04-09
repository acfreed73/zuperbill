// frontend/src/root.tsx
import {
  isRouteErrorResponse,
  Links,
  Meta,
  // Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { Outlet, Link, useNavigate } from "react-router-dom";

import type { Route } from "../app/+types/root";
import "./app.css";


export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-50 bg-gray-100 border-b shadow">
        <div className="flex items-center gap-4 text-sm max-w-screen-lg mx-auto p-4">
          <img src="/zuperhandy_white.gif" alt="ZuperHandy Logo" className="h-10" />
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/customers" className="text-blue-600 hover:underline">Customers</Link>
          <Link to="/reports/tech-summary" className="text-blue-600 hover:underline">Tech Summary Report</Link>
          <button
            onClick={handleLogout}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
