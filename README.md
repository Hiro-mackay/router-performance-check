# Router Performance Comparison

React Router v7 と Tanstack Router のパフォーマンスを比較するためのプロジェクトです。

## 📁 プロジェクト構成

```
router-performance-check/
├── 📁 react-router/          # React Router v7プロジェクト
├── 📁 tanstack-router/       # Tanstack Routerプロジェクト
├── 📁 next/                  # Next.jsプロジェクト
├── 📁 scripts/               # セットアップ・ユーティリティスクリプト
├── 📄 package.json          # オーケストレーション用スクリプト
└── 📄 .gitignore            # 統合gitignore設定
```

## 🚀 クイックスタート

### 初回セットアップ

```bash
# 1. 依存関係をインストール
pnpm install

# 2. 開発サーバーを同時起動
pnpm run dev

# 3. プレビュー環境起動
pnpm run preview

# 4. デプロイ
pnpm rnn deploy
```

### 🌐 アクセス URL

- **React Router**: http://localhost:5173
- **Tanstack Router**: http://localhost:5174
- **Next.js**: http://localhost:5175

## 📋 利用可能なコマンド

### 基本操作

```bash
pnpm run dev       # ホットリロード付き、開発環境
pnpm run preview   # Cloudflare Workerのローカル環境を立ち上げ
```

### 個別操作

```bash
pnpm run dev:react-router      # React Router開発サーバーのみ
pnpm run dev:tanstack-router   # Tanstack Router開発サーバーのみ
pnpm run dev:next              # Next.js開発サーバーのみ
```

### ビルド操作

```bash
pnpm run build                    # 全プロジェクトをビルド
pnpm run build:react-router       # React Routerのみビルド
pnpm run build:tanstack-router    # Tanstack Routerのみビルド
pnpm run build:next               # Next.jsのみビルド
```

### パフォーマンス測定

```bash
# ローカル環境での測定
pnpm run perf                    # 完全なパフォーマンステスト（ビルド + 測定 + 分析）
pnpm run perf:measure           # パフォーマンス測定のみ
pnpm run perf:analyze           # 結果の分析
pnpm run perf:report            # HTMLレポート生成

# Cloudflare Worker環境での測定
pnpm run perf:cloudflare        # Cloudflare Workerでのパフォーマンス測定
pnpm run perf:cloudflare:analyze # Cloudflare結果の分析
pnpm run perf:cloudflare:report  # Cloudflare用HTMLレポート生成
```

### デプロイ

```bash
pnpm run deploy                 # 全アプリケーションをCloudflare Workersにデプロイ
pnpm run deploy:react-router    # React Routerのみデプロイ
pnpm run deploy:tanstack-router # Tanstack Routerのみデプロイ
pnpm run deploy:next            # Next.jsのみデプロイ
```

## 🛠️ 技術スタック

### React Router v7

- **特徴**: サーバーサイドレンダリング、自動コード分割、型安全性
- **ポート**: 5173
- **ビルドツール**: Vite
- **デプロイ**: Cloudflare Workers

### Tanstack Router

- **特徴**: 高度な型推論、柔軟なローダー設計、自動コード分割
- **ポート**: 5174
- **ビルドツール**: Vite
- **デプロイ**: Cloudflare Workers

### Next.js

- **特徴**: App Router、サーバーサイドレンダリング、自動最適化
- **ポート**: 5175
- **ビルドツール**: OpenNext + Cloudflare
- **デプロイ**: Cloudflare Workers

## 📊 パフォーマンス測定について

### 測定環境の違い

このプロジェクトでは 2 つの異なる環境でパフォーマンスを測定しています：

#### 1. ローカル環境測定

- **目的**: 開発時の最適化指標
- **特徴**: ネットワーク遅延が最小限、リソースが豊富
- **結果**: TanStack Router > Next.js > React Router

#### 2. Cloudflare Worker 環境測定

- **目的**: 実際のユーザー体験指標
- **特徴**: 実際の CDN エッジでの実行、ネットワーク遅延が含まれる
- **結果**: React Router > TanStack Router > Next.js

### 測定結果の解釈

- **ローカル環境**: フレームワークの純粋なパフォーマンスを測定
- **Cloudflare Worker 環境**: 実際の本番環境でのユーザー体験を測定

両方の測定結果を考慮して、プロジェクトの要件に応じた選択を行うことを推奨します。

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 型エラー

```bash
pnpm run typecheck
```

#### ポート競合

各プロジェクトの `vite.config.ts` でポート番号を変更

#### ビルドエラー

```bash
# プロジェクト個別でのデバッグ
cd react-router && pnpm run build
cd tanstack-router && pnpm run build
cd next && pnpm run build
```

## 📚 参考資料

- [React Router v7 Documentation](https://reactrouter.com/)
- [Tanstack Router Documentation](https://tanstack.com/router/)
- [Next.js Documentation](https://nextjs.org/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 コントリビューション

パフォーマンス改善の提案やバグ報告は、Issue またはプルリクエストでお願いします。
