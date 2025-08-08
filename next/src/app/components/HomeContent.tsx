export default function HomeContent() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "2.5em", margin: "20px 0" }}>
          Welcome to Next.js Performance Test 🚀
        </h1>
        <p
          style={{
            fontSize: "1.2em",
            color: "#34495e",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          This application demonstrates high-performance data fetching and
          processing with Next.js App Router, designed for comprehensive
          performance benchmarking.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          marginTop: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#2c3e50", margin: "0 0 15px 0" }}>
            🏠 Home Page Features
          </h3>
          <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
            <li>✅ Server-side data fetching with Next.js App Router</li>
            <li>📊 Lightweight API calls (3 concurrent requests)</li>
            <li>⚡ Built-in caching with revalidate strategy</li>
            <li>🎯 Performance metrics tracking</li>
            <li>🔄 Automatic data refresh every 60 seconds</li>
          </ul>
        </div>

        <div
          style={{
            backgroundColor: "#fff3cd",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #ffeaa7",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#856404", margin: "0 0 15px 0" }}>
            📝 Posts Page Features
          </h3>
          <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
            <li>🔥 Heavy data processing (9 concurrent requests)</li>
            <li>📈 Complex data transformation and analysis</li>
            <li>💾 Large dataset handling (2MB+ data)</li>
            <li>🧠 Sentiment analysis simulation</li>
            <li>⚙️ CPU-intensive operations</li>
          </ul>
        </div>

        <div
          style={{
            backgroundColor: "#d1ecf1",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #bee5eb",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#0c5460", margin: "0 0 15px 0" }}>
            🚀 Performance Testing
          </h3>
          <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
            <li>📊 Real-time performance monitoring</li>
            <li>⏱️ Precise timing measurements</li>
            <li>🔍 Browser console logging</li>
            <li>📈 Detailed load statistics</li>
            <li>🎯 Cross-router comparison ready</li>
          </ul>
        </div>
      </div>

      <div
        style={{
          marginTop: "50px",
          padding: "30px",
          backgroundColor: "#e8f5e8",
          borderRadius: "12px",
          border: "2px solid #28a745",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#155724", margin: "0 0 20px 0" }}>
          🎯 Ready for Performance Benchmarking
        </h2>
        <p style={{ fontSize: "18px", margin: "15px 0", color: "#155724" }}>
          This Next.js application is now configured for comprehensive
          performance testing alongside React Router and TanStack Router
          implementations.
        </p>
        <div
          style={{
            marginTop: "25px",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <strong style={{ color: "#28a745", fontSize: "24px" }}>✅</strong>
            <p style={{ margin: "10px 0", fontWeight: "bold" }}>
              Server-Side Rendering
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <strong style={{ color: "#28a745", fontSize: "24px" }}>⚡</strong>
            <p style={{ margin: "10px 0", fontWeight: "bold" }}>App Router</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <strong style={{ color: "#28a745", fontSize: "24px" }}>📊</strong>
            <p style={{ margin: "10px 0", fontWeight: "bold" }}>
              Performance Metrics
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <strong style={{ color: "#28a745", fontSize: "24px" }}>🔧</strong>
            <p style={{ margin: "10px 0", fontWeight: "bold" }}>
              High Load Testing
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p style={{ fontSize: "16px", color: "#6c757d" }}>
          🔍 <strong>Performance Tip:</strong> Check the browser console for
          detailed fetch timing and processing information when navigating
          between pages.
        </p>
      </div>
    </div>
  );
}
