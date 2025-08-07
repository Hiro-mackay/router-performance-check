import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <nav
        style={{
          padding: "20px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f8f9fa",
          display: "flex",
          gap: "20px",
        }}
      >
        <Link
          to="/"
          activeProps={{
            style: {
              color: "#007bff",
              fontWeight: "bold",
            },
          }}
          inactiveProps={{
            style: {
              color: "#333",
              fontWeight: "normal",
            },
          }}
          style={{
            textDecoration: "none",
          }}
        >
          Home
        </Link>
        <Link
          to="/posts"
          activeProps={{
            style: {
              color: "#007bff",
              fontWeight: "bold",
            },
          }}
          inactiveProps={{
            style: {
              color: "#333",
              fontWeight: "normal",
            },
          }}
          style={{
            textDecoration: "none",
          }}
        >
          Posts (Performance Test)
        </Link>
      </nav>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
