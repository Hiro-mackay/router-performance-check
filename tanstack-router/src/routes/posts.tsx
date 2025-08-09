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

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface Album {
  id: number;
  userId: number;
  title: string;
}

interface Photo {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

interface LoaderData {
  posts: Post[];
  users: User[];
  comments: Comment[];
  albums: Album[];
  photos: Photo[];
  todos: Todo[];
  processedData: {
    postId: number;
    postTitle: string;
    postWordCount: number;
    author: {
      name: string;
      email: string;
      domain: string;
      website: string;
    } | null;
    commentsAnalysis: {
      total: number;
      averageLength: number;
      sentimentDistribution: Record<string, number>;
      totalEngagement: number;
    };
    metadata: {
      processed: boolean;
      timestamp: number;
      complexity: number;
    };
  }[];
  fetchStats: {
    totalRequests: number;
    totalDataSize: number;
    processingTime: number;
    totalTime: number;
  };
}

// 重いデータ処理を行う関数
function processHeavyData(posts: Post[], comments: Comment[], users: User[]) {
  const processed = [];

  // 複雑なデータ変換とフィルタリング
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const postComments = comments.filter((c) => c.postId === post.id);
    const user = users.find((u) => u.id === post.userId);

    // 重い計算処理をシミュレート
    const wordCount = post.body.split(" ").length;
    const commentStats = postComments.map((comment) => ({
      id: comment.id,
      wordCount: comment.body.split(" ").length,
      sentiment:
        comment.body.length % 3 === 0
          ? "positive"
          : comment.body.length % 3 === 1
          ? "neutral"
          : "negative",
      engagement: Math.random() * 100,
    }));

    // 複雑なオブジェクト作成
    processed.push({
      postId: post.id,
      postTitle: post.title,
      postWordCount: wordCount,
      author: user
        ? {
            name: user.name,
            email: user.email,
            domain: user.email.split("@")[1],
            website: user.website,
          }
        : null,
      commentsAnalysis: {
        total: postComments.length,
        averageLength:
          postComments.reduce((acc, c) => acc + c.body.length, 0) /
          (postComments.length || 1),
        sentimentDistribution: commentStats.reduce((acc, stat) => {
          acc[stat.sentiment] = (acc[stat.sentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalEngagement: commentStats.reduce(
          (acc, stat) => acc + stat.engagement,
          0
        ),
      },
      metadata: {
        processed: true,
        timestamp: Date.now(),
        complexity: wordCount * postComments.length,
      },
    });
  }

  return processed;
}

export const Route = createFileRoute("/posts")({
  loader: async (): Promise<LoaderData> => {
    const startTime = performance.now();

    console.log("TanStack Router - Starting high-load data fetching...");

    // 大量の並行APIリクエストを実行
    const [
      postsResponse,
      usersResponse,
      commentsResponse,
      albumsResponse,
      photosResponse,
      todosResponse,
      // 同じAPIを複数回呼び出してより多くの負荷をかける
      postsResponse2,
      commentsResponse2,
      photosResponse2,
    ] = await Promise.all([
      fetch("https://jsonplaceholder.typicode.com/posts"),
      fetch("https://jsonplaceholder.typicode.com/users"),
      fetch("https://jsonplaceholder.typicode.com/comments"),
      fetch("https://jsonplaceholder.typicode.com/albums"),
      fetch("https://jsonplaceholder.typicode.com/photos"),
      fetch("https://jsonplaceholder.typicode.com/todos"),
      // 追加のリクエストで負荷を増加
      fetch("https://jsonplaceholder.typicode.com/posts"),
      fetch("https://jsonplaceholder.typicode.com/comments"),
      fetch("https://jsonplaceholder.typicode.com/photos"),
    ]);

    const fetchEndTime = performance.now();

    // 全データの並行パース
    const [
      posts,
      users,
      comments,
      albums,
      photos,
      todos,
      posts2,
      comments2,
      photos2,
    ] = await Promise.all([
      postsResponse.json() as Promise<Post[]>,
      usersResponse.json() as Promise<User[]>,
      commentsResponse.json() as Promise<Comment[]>,
      albumsResponse.json() as Promise<Album[]>,
      photosResponse.json() as Promise<Photo[]>,
      todosResponse.json() as Promise<Todo[]>,
      postsResponse2.json() as Promise<Post[]>,
      commentsResponse2.json() as Promise<Comment[]>,
      photosResponse2.json() as Promise<Photo[]>,
    ]);

    const parseEndTime = performance.now();

    // データを結合してより大きなデータセットを作成
    const allPosts = [...posts, ...posts2];
    const allComments = [...comments, ...comments2];
    const allPhotos = [...photos, ...photos2];

    // 重いデータ処理を実行
    const processedData = processHeavyData(allPosts, allComments, users);

    const endTime = performance.now();

    const totalDataSize = JSON.stringify({
      posts: allPosts,
      users,
      comments: allComments,
      albums,
      photos: allPhotos,
      todos,
    }).length;

    const fetchStats = {
      totalRequests: 9,
      totalDataSize,
      processingTime: endTime - parseEndTime,
      totalTime: endTime - startTime,
    };

    console.log(`TanStack Router - High-load data fetching completed:`);
    console.log(`  - Total requests: ${fetchStats.totalRequests}`);
    console.log(`  - Fetch time: ${fetchEndTime - startTime}ms`);
    console.log(`  - Parse time: ${parseEndTime - fetchEndTime}ms`);
    console.log(`  - Processing time: ${fetchStats.processingTime}ms`);
    console.log(`  - Total time: ${fetchStats.totalTime}ms`);
    console.log(
      `  - Total data size: ${(totalDataSize / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `  - Posts: ${allPosts.length}, Comments: ${allComments.length}, Photos: ${allPhotos.length}`
    );

    return {
      posts: allPosts,
      users,
      comments: allComments,
      albums,
      photos: allPhotos,
      todos,
      processedData,
      fetchStats,
    };
  },
  component: Posts,
});

function Posts() {
  const {
    posts,
    users,
    comments,
    albums,
    photos,
    todos,
    processedData,
    fetchStats,
  } = Route.useLoaderData();

  // ユーザー情報をIDでマップ化
  const userMap = users.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {} as Record<number, User>);

  // 表示用の統計情報を計算
  const displayStats = {
    totalPosts: posts.length,
    totalUsers: users.length,
    totalComments: comments.length,
    totalAlbums: albums.length,
    totalPhotos: photos.length,
    totalTodos: todos.length,
    processedItems: processedData.length,
    averageCommentsPerPost: (comments.length / posts.length).toFixed(1),
    completedTodos: todos.filter((t) => t.completed).length,
    dataSizeMB: (fetchStats.totalDataSize / 1024 / 1024).toFixed(2),
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Posts (TanStack Router) - High Load Version</h1>

      {/* パフォーマンス統計 */}
      <div
        style={{
          backgroundColor: "#f0f8ff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px solid #4682b4",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
          📊 High-Load Performance Stats
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <strong>🚀 Fetch Performance:</strong>
            <p>Total Requests: {fetchStats.totalRequests}</p>
            <p>Total Time: {fetchStats.totalTime.toFixed(2)}ms</p>
            <p>Processing Time: {fetchStats.processingTime.toFixed(2)}ms</p>
          </div>
          <div>
            <strong>📈 Data Volume:</strong>
            <p>Posts: {displayStats.totalPosts}</p>
            <p>Comments: {displayStats.totalComments}</p>
            <p>Photos: {displayStats.totalPhotos}</p>
            <p>Total Size: {displayStats.dataSizeMB}MB</p>
          </div>
          <div>
            <strong>⚡ Processing:</strong>
            <p>Processed Items: {displayStats.processedItems}</p>
            <p>Avg Comments/Post: {displayStats.averageCommentsPerPost}</p>
            <p>Albums: {displayStats.totalAlbums}</p>
            <p>Todos: {displayStats.totalTodos}</p>
          </div>
        </div>
      </div>

      {/* データ表示 */}
      <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
        {posts.slice(0, 15).map((post) => {
          const user = userMap[post.userId];
          const postComments = comments.filter((c) => c.postId === post.id);
          const processedItem = processedData.find((p) => p.postId === post.id);

          return (
            <div
              key={post.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#f9f9f9",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                {post.title} #{post.id}
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
                <div
                  style={{
                    fontSize: "14px",
                    color: "#888",
                    marginBottom: "12px",
                  }}
                >
                  <p style={{ margin: "4px 0" }}>
                    <strong>Author:</strong> {user.name} ({user.email})
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Website:</strong> {user.website}
                  </p>
                </div>
              )}

              {/* コメント情報 */}
              <div
                style={{
                  backgroundColor: "#e8f4f8",
                  padding: "10px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  marginTop: "10px",
                }}
              >
                <strong>💬 Comments Analysis:</strong>
                <p>Total Comments: {postComments.length}</p>
                {processedItem && (
                  <>
                    <p>Word Count: {processedItem.postWordCount}</p>
                    <p>
                      Avg Comment Length:{" "}
                      {processedItem.commentsAnalysis.averageLength.toFixed(1)}
                    </p>
                    <p>
                      Total Engagement:{" "}
                      {processedItem.commentsAnalysis.totalEngagement.toFixed(
                        1
                      )}
                    </p>
                    <p>
                      Sentiment: Positive:{" "}
                      {processedItem.commentsAnalysis.sentimentDistribution
                        .positive || 0}
                      , Neutral:{" "}
                      {processedItem.commentsAnalysis.sentimentDistribution
                        .neutral || 0}
                      , Negative:{" "}
                      {processedItem.commentsAnalysis.sentimentDistribution
                        .negative || 0}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "1px solid #ffeaa7",
        }}
      >
        <h2>⚡ High-Load Performance Testing</h2>
        <p>
          <strong>
            This page now performs intensive data fetching and processing:
          </strong>
        </p>
        <ul>
          <li>
            🔥{" "}
            <strong>
              {fetchStats.totalRequests} simultaneous API requests
            </strong>
          </li>
          <li>
            📊 <strong>{displayStats.dataSizeMB}MB of data</strong> downloaded
            and processed
          </li>
          <li>
            ⚙️ <strong>Heavy CPU processing</strong> for data transformation
          </li>
          <li>
            🚀 <strong>Complex sentiment analysis</strong> and statistics
            calculation
          </li>
          <li>
            📈 <strong>Real-time performance metrics</strong> tracking
          </li>
        </ul>
        <p>
          Check the browser console for detailed fetch timing and processing
          information.
        </p>
        <p style={{ color: "#d63031", fontWeight: "bold" }}>
          Total processing time: {fetchStats.totalTime.toFixed(2)}ms
        </p>
      </div>
    </div>
  );
}
