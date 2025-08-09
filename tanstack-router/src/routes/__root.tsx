import { Outlet, createRootRoute, Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
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
            🚀 TanStack Router Performance Test
          </h1>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link
              to="/"
              activeProps={{
                style: {
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#3498db",
                  transition: "all 0.3s ease",
                },
              }}
              inactiveProps={{
                style: {
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#34495e",
                  transition: "all 0.3s ease",
                },
              }}
              className="nav-link"
            >
              🏠 Home
            </Link>
            <Link
              to="/posts"
              activeProps={{
                style: {
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#3498db",
                  transition: "all 0.3s ease",
                },
              }}
              inactiveProps={{
                style: {
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#34495e",
                  transition: "all 0.3s ease",
                },
              }}
              className="nav-link"
            >
              📝 Posts
            </Link>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  ),
  errorComponent: ({ error }) => {
    const message = "Oops!";
    const details = error?.message || "An unexpected error occurred.";
    const stack = error?.stack;

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
  },
});
