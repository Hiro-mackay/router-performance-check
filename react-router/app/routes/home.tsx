import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

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

export async function loader(): Promise<LoaderData> {
  const startTime = performance.now();

  console.log("React Router Home - Starting initial data fetch...");

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
    `React Router Home - Initial fetch completed in ${totalTime.toFixed(2)}ms`
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
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App - High Load" },
    {
      name: "description",
      content: "Welcome to React Router with performance testing!",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { initialData } = loaderData;

  return (
    <div style={{ padding: "20px" }}>
      {/* データフェッチ統計を表示 */}
      <div
        style={{
          backgroundColor: "#e8f4f8",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #4682b4",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
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

      <Welcome />
    </div>
  );
}
