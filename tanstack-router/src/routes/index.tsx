import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";

interface LoaderData {
  initialData: {
    posts: any[];
    users: any[];
    photos: any[];
    fetchStats: {
      totalTime: number;
      requestCount: number;
      dataSize: number;
    };
  };
}

export const Route = createFileRoute("/")({
  loader: async (): Promise<LoaderData> => {
    const startTime = performance.now();

    console.log("TanStack Router Home - Starting initial data fetch...");

    // ホームページでも軽めのデータを取得
    const [postsResponse, usersResponse, photosResponse] = await Promise.all([
      fetch("https://jsonplaceholder.typicode.com/posts?_limit=20"),
      fetch("https://jsonplaceholder.typicode.com/users"),
      fetch("https://jsonplaceholder.typicode.com/photos?_limit=50"),
    ]);

    const [posts, users, photos] = await Promise.all([
      postsResponse.json(),
      usersResponse.json(),
      photosResponse.json(),
    ]);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const dataSize = JSON.stringify({ posts, users, photos }).length;

    console.log(
      `TanStack Router Home - Initial fetch completed in ${totalTime.toFixed(2)}ms`
    );
    console.log(`  - Data size: ${(dataSize / 1024).toFixed(2)}KB`);

    return {
      initialData: {
        posts,
        users,
        photos,
        fetchStats: {
          totalTime,
          requestCount: 3,
          dataSize,
        },
      },
    };
  },
  component: App,
});

function App() {
  const { initialData } = Route.useLoaderData();

  return (
    <div className="text-center">
      <header className="bg-gray-800 min-h-screen flex flex-col items-center justify-center text-white text-[calc(10px+2vmin)]">
        {/* データフェッチ統計を表示 */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #4682b4",
            fontSize: "14px",
            maxWidth: "400px",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#87ceeb" }}>
            🏠 Home Page Load Stats
          </h3>
          <p>
            <strong>Initial fetch time:</strong>{" "}
            {initialData.fetchStats.totalTime.toFixed(2)}ms
          </p>
          <p>
            <strong>Requests:</strong> {initialData.fetchStats.requestCount}
          </p>
          <p>
            <strong>Data loaded:</strong>{" "}
            {(initialData.fetchStats.dataSize / 1024).toFixed(2)}KB
          </p>
          <p>
            <strong>Posts preview:</strong> {initialData.posts.length} items
          </p>
          <p>
            <strong>Users:</strong> {initialData.users.length} items
          </p>
          <p>
            <strong>Photos preview:</strong> {initialData.photos.length} items
          </p>
        </div>

        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-spin duration-[20s] linear infinite"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <p style={{ fontSize: "16px", margin: "10px 0", color: "#87ceeb" }}>
          🚀 <strong>High-Load Performance Testing Enabled</strong>
        </p>
        <a
          className="text-blue-400 hover:text-blue-300"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a
          className="text-blue-400 hover:text-blue-300 ml-4"
          href="https://tanstack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn TanStack
        </a>
      </header>
    </div>
  );
}
