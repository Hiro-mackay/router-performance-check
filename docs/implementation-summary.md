# Router Performance Comparison - 実装完了レポート

このドキュメントは、ReactRouter と Tanstack Router のパフォーマンス比較プロジェクトの実装完了内容をまとめたものです。

## 実装完了内容

### ✅ 完了した機能

#### 1. React Router プロジェクト

- JSONPlaceholder API からデータを取得する loader を実装
- ポストとユーザー情報を表示するページコンポーネント
- ナビゲーション機能付きのレイアウト

#### 2. Tanstack Router プロジェクト

- 同様の API 取得機能を Tanstack Router 形式で実装
- React Router と同等の機能を持つページコンポーネント
- ナビゲーション機能付きのレイアウト

#### 3. パフォーマンス測定機能

- 自動ビルド時間測定
- バンドルサイズ分析（JavaScript、CSS、総サイズ）
- 結果の比較表示
- バンドル視覚化ツール（rollup-plugin-visualizer）

#### 4. 使用方法の詳細ドキュメント

- 自動・手動両方のテスト方法
- ブラウザ DevTools での測定ガイド
- Core Web Vitals の測定方法

## 📊 初回測定結果

- **ビルド時間**: React Router (2594ms) vs Tanstack Router (2938ms) - React Router が 1.13 倍高速
- **総バンドルサイズ**: React Router (338.23 KB) vs Tanstack Router (496.93 KB) - React Router が 158.71 KB 小さい
- **JavaScript サイズ**: React Router (302.37 KB) vs Tanstack Router (260.05 KB) - Tanstack Router が 42.32 KB 小さい

## 🚀 次のステップ

### 1. 開発サーバーの起動

```bash
# React Router
cd react-router && npm run dev

# Tanstack Router
cd tanstack-router && npm run dev
```

### 2. リアルタイムパフォーマンステスト

- 両方のアプリで `/posts` ページにアクセス
- ブラウザ DevTools でネットワーク・パフォーマンス測定
- コンソールで API 取得時間を確認

### 3. バンドル分析

- Tanstack Router: `./tanstack-router/dist/stats.html`
- React Router: ビルド設定を調整して stats.html を生成

## 実装詳細

### API データ取得

両プロジェクトで以下のパブリック API を使用：

- Posts: https://jsonplaceholder.typicode.com/posts
- Users: https://jsonplaceholder.typicode.com/users

### パフォーマンス測定ポイント

1. **データ取得時間**: loader での API 取得時間（performance.now()でログ出力）
2. **ビルド時間**: プロジェクトのビルドにかかる時間
3. **バンドルサイズ**: JavaScript、CSS、総ファイルサイズ

### ファイル構成

- `react-router/app/routes/posts.tsx`: React Router 版のデータ取得ページ
- `tanstack-router/src/routes/posts.tsx`: Tanstack Router 版のデータ取得ページ
- `performance-test.js`: 自動パフォーマンステストスクリプト
- `README.md`: プロジェクト全体の使用方法

## 測定方法

### 自動テスト

```bash
node performance-test.js
```

### 手動測定

1. ブラウザ DevTools Performance タブでページロード測定
2. Network タブで API リクエストタイミング確認
3. Console でデータ取得時間ログ確認

## パフォーマンス最適化の実装

### React Router

- サーバーサイドレンダリング (SSR) サポート
- 自動コード分割
- 型安全なルーティング

### Tanstack Router

- 高度な型推論
- 自動コード分割（autoCodeSplitting: true）
- フレキシブルなローダー設計

実際のデータ取得を含む本格的なパフォーマンス比較環境が整いました！
