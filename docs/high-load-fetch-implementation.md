# 高負荷フェッチ機能の実装ガイド

## 概要

このドキュメントでは、React Router と TanStack Router の両方のアプリケーションに実装された高負荷フェッチ機能について詳しく説明します。この実装により、より現実的な負荷環境でのパフォーマンス比較が可能になりました。

## 📊 実装された機能

### 1. 大幅に増加したデータ取得量

#### 以前の実装

- **2 つの API リクエスト**（posts, users）
- **軽量なデータ処理**
- **約 50KB 程度のデータ**

#### 新しい実装

- **9 つの同時 API リクエスト**
- **約 2MB 以上のデータ処理**
- **複雑なデータ変換と CPU 集約的な処理**

### 2. 取得するデータの種類

```typescript
// 取得されるデータ
- posts (投稿) - 2回取得
- users (ユーザー)
- comments (コメント) - 2回取得
- albums (アルバム)
- photos (写真) - 2回取得
- todos (タスク)
```

### 3. 重いデータ処理の実装

```typescript
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

    // 複雑なオブジェクト作成と統計計算
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
```

## 🔍 実装詳細

### React Router の実装

#### 1. Posts ページ (`react-router/app/routes/posts.tsx`)

```typescript
export async function loader(): Promise<LoaderData> {
  const startTime = performance.now();

  console.log("React Router - Starting high-load data fetching...");

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

  // データの並行パース
  const [posts, users, comments, albums, photos, todos, posts2, comments2, photos2] =
    await Promise.all([
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

  // データを結合してより大きなデータセットを作成
  const allPosts = [...posts, ...posts2];
  const allComments = [...comments, ...comments2];
  const allPhotos = [...photos, ...photos2];

  // 重いデータ処理を実行
  const processedData = processHeavyData(allPosts, allComments, users);

  const endTime = performance.now();

  // パフォーマンス統計の計算
  const fetchStats = {
    totalRequests: 9,
    totalDataSize: JSON.stringify({...}).length,
    processingTime: endTime - parseEndTime,
    totalTime: endTime - startTime,
  };

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
}
```

#### 2. Home ページ (`react-router/app/routes/home.tsx`)

```typescript
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
```

### TanStack Router の実装

#### 1. Posts ページ (`tanstack-router/src/routes/posts.tsx`)

TanStack Router の実装は、React Router とほぼ同じロジックを使用していますが、`createFileRoute`の loader 内で実装されています：

```typescript
export const Route = createFileRoute("/posts")({
  loader: async (): Promise<LoaderData> => {
    // React Routerと同じ高負荷処理ロジック
    // ...
  },
  component: Posts,
});
```

#### 2. Home ページ (`tanstack-router/src/routes/index.tsx`)

```typescript
export const Route = createFileRoute("/")({
  loader: async (): Promise<LoaderData> => {
    // React Routerと同じ初期データ取得ロジック
    // ...
  },
  component: App,
});
```

## 📈 パフォーマンス測定機能

### 1. 詳細なタイミング測定

```typescript
const startTime = performance.now();
const fetchEndTime = performance.now(); // fetch完了時点
const parseEndTime = performance.now(); // parse完了時点
const endTime = performance.now(); // 全処理完了時点

const fetchStats = {
  totalRequests: 9,
  totalDataSize,
  processingTime: endTime - parseEndTime,
  totalTime: endTime - startTime,
};
```

### 2. コンソール出力

```
React Router - High-load data fetching completed:
  - Total requests: 9
  - Fetch time: 245.30ms
  - Parse time: 12.10ms
  - Processing time: 8.40ms
  - Total time: 265.80ms
  - Total data size: 2.34MB
  - Posts: 200, Comments: 1000, Photos: 10000
```

### 3. UI 上での統計表示

各ページで以下の情報が表示されます：

- **🚀 Fetch Performance**: リクエスト数、総時間、処理時間
- **📈 Data Volume**: 投稿数、コメント数、写真数、総データサイズ
- **⚡ Processing**: 処理済みアイテム数、平均統計、分析結果

## 🧪 パフォーマンステストの更新

### 更新されたテストスクリプト

`browser-performance-test.js`が以下の点で更新されました：

1. **テストタイトルの更新**

   ```javascript
   console.log(
     "🚀 Browser-based Router Performance Comparison Test (High-Load Version)\n"
   );
   ```

2. **テスト説明の追加**
   ```javascript
   testDescription: "High-load version with 9 API requests, 2MB+ data, and heavy processing";
   ```

## 💡 使用方法

### 1. アプリケーションの起動

```bash
# 両方のアプリを同時に起動
npm run dev

# または個別に起動
npm run dev:react-router  # http://localhost:5173
npm run dev:tanstack-router  # http://localhost:3000
```

### 2. 高負荷動作の確認

1. **ブラウザでページを訪問**

   - Home: `/` - 軽負荷版（3 リクエスト）
   - Posts: `/posts` - 高負荷版（9 リクエスト）

2. **ブラウザコンソールを確認**

   ```
   React Router - Starting high-load data fetching...
   React Router - High-load data fetching completed:
     - Total requests: 9
     - Fetch time: 245.30ms
     - Parse time: 12.10ms
     - Processing time: 8.40ms
     - Total time: 265.80ms
     - Total data size: 2.34MB
     - Posts: 200, Comments: 1000, Photos: 10000
   ```

3. **ページ上の統計情報を確認**
   - パフォーマンス統計セクション
   - 各投稿のコメント分析
   - 感情分析結果

### 3. パフォーマンステストの実行

```bash
# 自動ブラウザテストを実行
node browser-performance-test.js
```

## 🔧 技術的な詳細

### データ処理の複雑さ

1. **O(n²)の計算複雑度**

   - 各投稿に対してコメントをフィルタリング
   - ユーザー情報の検索と結合

2. **メモリ集約的な処理**

   - 大量のオブジェクト作成
   - JSON 文字列化によるサイズ計算

3. **CPU 集約的な処理**
   - 文字列分割と単語カウント
   - 感情分析のシミュレーション
   - 統計計算と集約

### パフォーマンス最適化の観点

この実装は意図的に**非最適化**されており、以下の負荷を生成します：

1. **ネットワーク負荷**: 9 つの同時リクエスト
2. **メモリ負荷**: 大量のデータの保持と変換
3. **CPU 負荷**: 複雑な計算処理
4. **レンダリング負荷**: 大量の DOM ノードの生成

## 📊 期待される効果

### 1. より現実的なパフォーマンス比較

- **実際のアプリケーションに近い負荷**
- **ネットワーク、CPU、メモリの総合的な測定**
- **ルーター固有の最適化の効果測定**

### 2. 詳細なパフォーマンス分析

- **フェーズ別のタイミング測定**
- **データサイズとパフォーマンスの関係**
- **並行処理の効果測定**

### 3. 実用的なベンチマーク

- **大規模アプリケーションでの動作予測**
- **スケーラビリティの評価**
- **ボトルネックの特定**

## 🚀 まとめ

この高負荷フェッチ機能の実装により：

- **9 倍の API リクエスト**（2 → 9）
- **40 倍以上のデータ量**（50KB → 2MB+）
- **複雑なデータ処理**の追加
- **詳細なパフォーマンス測定**機能

これらの改善により、React Router と TanStack Router の**より現実的で意味のあるパフォーマンス比較**が可能になりました。
