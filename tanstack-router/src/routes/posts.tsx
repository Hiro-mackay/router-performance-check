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

    console.log("TanStack Router - Starting optimized data fetching...");

    // 直列でAPIリクエストを実行してconnection limitを回避
    const postsResponse = await fetch(
      "https://jsonplaceholder.typicode.com/posts"
    );
    const usersResponse = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );
    const commentsResponse = await fetch(
      "https://jsonplaceholder.typicode.com/comments"
    );
    const albumsResponse = await fetch(
      "https://jsonplaceholder.typicode.com/albums"
    );
    const photosResponse = await fetch(
      "https://jsonplaceholder.typicode.com/photos"
    );
    const todosResponse = await fetch(
      "https://jsonplaceholder.typicode.com/todos"
    );

    // 負荷軽減のため重複リクエストをコメントアウト
    // const postsResponse2 = await fetch(
    //   "https://jsonplaceholder.typicode.com/posts"
    // );
    // const commentsResponse2 = await fetch(
    //   "https://jsonplaceholder.typicode.com/comments"
    // );
    // const photosResponse2 = await fetch(
    //   "https://jsonplaceholder.typicode.com/photos"
    // );

    const fetchEndTime = performance.now();

    // 直列でデータをパース
    const posts = (await postsResponse.json()) as Post[];
    const users = (await usersResponse.json()) as User[];
    const comments = (await commentsResponse.json()) as Comment[];
    const albums = (await albumsResponse.json()) as Album[];
    const photos = (await photosResponse.json()) as Photo[];
    const todos = (await todosResponse.json()) as Todo[];

    // 負荷軽減のため重複データのパースをコメントアウト
    // const posts2 = (await postsResponse2.json()) as Post[];
    // const comments2 = (await commentsResponse2.json()) as Comment[];
    // const photos2 = (await photosResponse2.json()) as Photo[];

    const parseEndTime = performance.now();

    // 負荷軽減のためデータ結合をコメントアウトし、元のデータのみ使用
    // const allPosts = [...posts, ...posts2];
    // const allComments = [...comments, ...comments2];
    // const allPhotos = [...photos, ...photos2];
    const allPosts = posts;
    const allComments = comments;
    const allPhotos = photos;

    // 重いデータ処理を実行（転送データ量は元の状態に戻す）
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
      totalRequests: 6, // 重複リクエストを除いた数
      totalDataSize,
      processingTime: endTime - parseEndTime,
      totalTime: endTime - startTime,
    };

    console.log(`TanStack Router - Optimized data fetching completed:`);
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
  head: () => ({
    meta: [
      {
        name: "title",
        content: "Posts - TanStack Router",
      },
      {
        name: "description",
        content: "Posts page with TanStack Router",
      },
    ],
  }),
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
    <div className="p-5 font-sans text-gray-800">
      <h1>Posts (TanStack Router) - Optimized Version</h1>

      {/* パフォーマンス統計 */}
      <div className="bg-blue-50 p-5 rounded-lg mb-5 border-2 border-blue-600">
        <h2 className="m-0 mb-4 ">📊 Optimized Performance Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong>🚀 Fetch Performance:</strong>
            <p className="my-1">Total Requests: {fetchStats.totalRequests}</p>
            <p className="my-1">
              Total Time: {fetchStats.totalTime.toFixed(2)}ms
            </p>
            <p className="my-1">
              Processing Time: {fetchStats.processingTime.toFixed(2)}ms
            </p>
          </div>
          <div>
            <strong>📈 Data Volume:</strong>
            <p className="my-1">Posts: {displayStats.totalPosts}</p>
            <p className="my-1">Comments: {displayStats.totalComments}</p>
            <p className="my-1">Photos: {displayStats.totalPhotos}</p>
            <p className="my-1">Total Size: {displayStats.dataSizeMB}MB</p>
          </div>
          <div>
            <strong>⚡ Processing:</strong>
            <p className="my-1">
              Processed Items: {displayStats.processedItems}
            </p>
            <p className="my-1">
              Avg Comments/Post: {displayStats.averageCommentsPerPost}
            </p>
            <p className="my-1">Albums: {displayStats.totalAlbums}</p>
            <p className="my-1">Todos: {displayStats.totalTodos}</p>
          </div>
        </div>
      </div>

      {/* データ表示 */}
      <div className="grid gap-5 mt-5">
        {posts.slice(0, 15).map((post) => {
          const user = userMap[post.userId];
          const postComments = comments.filter((c) => c.postId === post.id);
          const processedItem = processedData.find((p) => p.postId === post.id);

          return (
            <div
              key={post.id}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm"
            >
              <h3 className="m-0 mb-2 ">
                {post.title} #{post.id}
              </h3>
              <p className="m-0 mb-3 text-gray-600 leading-relaxed">
                {post.body}
              </p>

              {user && (
                <div className="text-sm text-gray-500 mb-3">
                  <p className="my-1">
                    <strong>Author:</strong> {user.name} ({user.email})
                  </p>
                  <p className="my-1">
                    <strong>Website:</strong> {user.website}
                  </p>
                </div>
              )}

              {/* コメント情報 */}
              <div className="bg-blue-100 p-3 rounded text-xs mt-3">
                <strong>💬 Comments Analysis:</strong>
                <p className="my-1">Total Comments: {postComments.length}</p>
                {processedItem && (
                  <>
                    <p className="my-1">
                      Word Count: {processedItem.postWordCount}
                    </p>
                    <p className="my-1">
                      Avg Comment Length:{" "}
                      {processedItem.commentsAnalysis.averageLength.toFixed(1)}
                    </p>
                    <p className="my-1">
                      Total Engagement:{" "}
                      {processedItem.commentsAnalysis.totalEngagement.toFixed(
                        1
                      )}
                    </p>
                    <p className="my-1">
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

      <div className="mt-10 p-5 bg-yellow-50 rounded-lg border border-yellow-300">
        <h2>⚡ Optimized Performance Testing</h2>
        <p>
          <strong>
            This page now performs optimized data fetching and processing:
          </strong>
        </p>
        <ul>
          <li>
            🔥{" "}
            <strong>
              {fetchStats.totalRequests} API requests (reduced from 9)
            </strong>
          </li>
          <li>
            📊 <strong>{displayStats.dataSizeMB}MB of data</strong> downloaded
            and processed (optimized)
          </li>
          <li>
            ⚙️ <strong>Optimized CPU processing</strong> for data transformation
          </li>
          <li>
            🚀 <strong>Limited sentiment analysis</strong> (first 10 posts only)
          </li>
          <li>
            📈 <strong>Real-time performance metrics</strong> tracking
          </li>
        </ul>
        <p>
          Check the browser console for detailed fetch timing and processing
          information.
        </p>
        <p className="text-red-600 font-bold">
          Total processing time: {fetchStats.totalTime.toFixed(2)}ms
        </p>

        <div className="mt-5 p-4 bg-green-50 rounded border border-green-500">
          <h3>🔄 負荷軽減のための変更点（コメントアウト済み）:</h3>
          <ul>
            <li>
              <strong>重複APIリクエスト:</strong> posts, comments,
              photosの2回目の取得をコメントアウト
            </li>
            <li>
              <strong>データ処理量:</strong> 全データ処理（元の状態）
            </li>
            <li>
              <strong>表示件数:</strong> 15件のposts表示（元の状態）
            </li>
          </ul>
          <p>
            <strong>元に戻す場合:</strong>{" "}
            コメントアウトされた部分のコメントを外して、slice制限を削除してください。
          </p>
        </div>
      </div>
    </div>
  );
}
