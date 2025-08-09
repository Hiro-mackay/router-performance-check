import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Next.js Router Performance Test",
  description: "Performance testing with Next.js App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
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
              🚀 Next.js Performance Test
            </h1>
            <div style={{ display: "flex", gap: "20px" }}>
              <Link
                href="/"
                style={{
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#34495e",
                  transition: "all 0.3s ease",
                }}
                className="nav-link"
              >
                🏠 Home
              </Link>
              <Link
                href="/posts"
                style={{
                  color: "#ecf0f1",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #34495e",
                  backgroundColor: "#34495e",
                  transition: "all 0.3s ease",
                }}
                className="nav-link"
              >
                📝 Posts
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
