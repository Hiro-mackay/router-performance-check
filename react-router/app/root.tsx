import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [];

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
  return (
    <div>
      <nav
        style={{
          backgroundColor: "#2c3e50",
          padding: "15px 20px",
          color: "white",
          borderBottom: "3px solid #3498db",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            🚀 React Router Performance Test
          </h1>
          <div style={{ display: "flex", gap: "20px" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: "#ecf0f1",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #34495e",
                backgroundColor: isActive ? "#3498db" : "#34495e",
                transition: "all 0.3s ease",
              })}
              className="nav-link"
            >
              🏠 Home
            </NavLink>
            <NavLink
              to="/posts"
              style={({ isActive }) => ({
                color: "#ecf0f1",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #34495e",
                backgroundColor: isActive ? "#3498db" : "#34495e",
                transition: "all 0.3s ease",
              })}
              className="nav-link"
            >
              📝 Posts
            </NavLink>
          </div>
        </div>
      </nav>
      <Outlet />
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
