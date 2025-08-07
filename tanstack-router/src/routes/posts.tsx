import { createFileRoute } from "@tanstack/react-router";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  website: string;
}

interface LoaderData {
  posts: Post[];
  users: User[];
}

export const Route = createFileRoute("/posts")({
  loader: async (): Promise<LoaderData> => {
    const startTime = performance.now();

    // 複数のAPIを並行して取得
    const [postsResponse, usersResponse] = await Promise.all([
      fetch("https://jsonplaceholder.typicode.com/posts"),
      fetch("https://jsonplaceholder.typicode.com/users"),
    ]);

    const [posts, users] = await Promise.all([
      postsResponse.json() as Promise<Post[]>,
      usersResponse.json() as Promise<User[]>,
    ]);

    const endTime = performance.now();
    console.log(
      `Tanstack Router - Data fetching took ${endTime - startTime} milliseconds`
    );

    return { posts, users };
  },
  component: Posts,
});

function Posts() {
  const { posts, users } = Route.useLoaderData();

  // ユーザー情報をIDでマップ化
  const userMap = users.reduce(
    (map, user) => {
      map[user.id] = user;
      return map;
    },
    {} as Record<number, User>
  );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Posts (Tanstack Router)</h1>
      <p>Total posts: {posts.length}</p>
      <p>Total users: {users.length}</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {posts.slice(0, 10).map((post) => {
          const user = userMap[post.userId];
          return (
            <div
              key={post.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                {post.title}
              </h3>
              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "#666",
                  lineHeight: "1.5",
                }}
              >
                {post.body}
              </p>
              {user && (
                <div style={{ fontSize: "14px", color: "#888" }}>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Author:</strong> {user.name} ({user.email})
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Website:</strong> {user.website}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#e8f4f8",
          borderRadius: "8px",
        }}
      >
        <h2>Performance Info</h2>
        <p>
          This page demonstrates Tanstack Router's data loading capabilities.
        </p>
        <p>Check the browser console for fetch timing information.</p>
      </div>
    </div>
  );
}
