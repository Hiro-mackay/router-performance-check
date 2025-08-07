# Router Performance Comparison

React Router v7 と Tanstack Router のパフォーマンスを比較するためのプロジェクトです。

## 📁 プロジェクト構成

```
router-performance-check/
├── 📁 react-router/          # React Router v7プロジェクト
├── 📁 tanstack-router/       # Tanstack Routerプロジェクト
├── 📁 scripts/               # セットアップ・ユーティリティスクリプト
├── 📁 docs/                  # ドキュメント
├── 📄 performance-test.js    # 自動パフォーマンステスト
├── 📄 package.json          # オーケストレーション用スクリプト
└── 📄 .gitignore            # 統合gitignore設定
```

## 🎯 測定項目

### 1. ビルド時間

- プロジェクトのビルドにかかる時間の比較
- 依存関係のインストール時間

### 2. バンドルサイズ

- 総バンドルサイズ（gzip 圧縮前後）
- JavaScript ファイルサイズ
- CSS ファイルサイズ
- コード分割の効果

### 3. ランタイムパフォーマンス

- 初期ページロード時間
- データ取得時間（JSONPlaceholder API）
- ページナビゲーション時間
- Core Web Vitals (LCP, FID, CLS)

## 🚀 クイックスタート

### 初回セットアップ

```bash
# 1. 依存関係をインストール
npm install

# 2. プロジェクトの初期セットアップ
npm run setup

# 3. 開発サーバーを同時起動
npm run dev
```

### 🌐 アクセス URL

- **React Router**: http://localhost:5173
- **Tanstack Router**: http://localhost:3000

## 📋 利用可能なコマンド

### 基本操作

```bash
npm run setup           # 初回セットアップ（依存関係 + 型生成）
npm run dev            # 両方の開発サーバーを同時起動
npm start              # npm run dev のエイリアス
npm run test:performance  # パフォーマンステスト実行
```

### 個別操作

```bash
npm run dev:react-router      # React Router開発サーバーのみ
npm run dev:tanstack-router   # Tanstack Router開発サーバーのみ
```

### ビルド操作

```bash
npm run build                    # 両プロジェクトをビルド
npm run build:react-router       # React Routerのみビルド
npm run build:tanstack-router    # Tanstack Routerのみビルド
npm run build:analyze            # バンドル分析付きビルド
```

### メンテナンス

```bash
npm run clean        # ビルドキャッシュをクリア
npm run typecheck    # 両プロジェクトの型チェック
npm run install:all  # 両プロジェクトの依存関係を再インストール
```

## 🧪 パフォーマンステスト

### 自動テスト

```bash
npm run test:performance
```

このコマンドは以下を実行します：

- 両プロジェクトの自動ビルド
- ビルド時間の測定・比較
- バンドルサイズの分析・比較
- 結果のコンソール出力

### 手動テスト

1. **ページロード測定**

   - ブラウザの DevTools → Performance タブ
   - ページリロード時の詳細分析

2. **API 取得性能**

   - `/posts` ページでデータロード時間を測定
   - ブラウザコンソールでタイミングログを確認

3. **ナビゲーション性能**
   - ページ間遷移時間の測定
   - クライアントサイドルーティングの効率性

## 📊 バンドル分析

### React Router

```bash
npm run build:analyze:react-router
```

結果: `./performance-results/react-router-stats.html`

### Tanstack Router

```bash
npm run build:analyze:tanstack-router
```

結果: `./performance-results/tanstack-router-stats.html`

### パフォーマンス結果の管理

```bash
# パフォーマンステスト実行後の結果ファイル
./performance-results/
├── latest-results.json           # 最新の測定結果
├── results-[timestamp].json      # タイムスタンプ付き履歴
├── react-router-stats.html       # React Routerバンドル分析
└── tanstack-router-stats.html    # Tanstack Routerバンドル分析
```

## 🔍 測定対象 API

### JSONPlaceholder API

- **Posts**: https://jsonplaceholder.typicode.com/posts
- **Users**: https://jsonplaceholder.typicode.com/users

両プロジェクトの `/posts` ページで以下を実装：

- 並行 API 取得によるパフォーマンス最適化
- ユーザー情報との結合表示
- 取得時間のコンソールログ出力

## 🛠️ 技術スタック

### React Router v7

- **特徴**: サーバーサイドレンダリング、自動コード分割、型安全性
- **ポート**: 5173
- **ビルドツール**: Vite

### Tanstack Router

- **特徴**: 高度な型推論、柔軟なローダー設計、自動コード分割
- **ポート**: 3000
- **ビルドツール**: Vite

## 📈 パフォーマンス測定のベストプラクティス

### 測定前の準備

1. ブラウザキャッシュをクリア
2. ネットワーク条件を統一
3. 複数回測定して平均値を算出

### 測定項目

- **初回ロード**: ページの初回アクセス時間
- **リロード**: キャッシュ有効時のロード時間
- **ナビゲーション**: SPA 内でのページ遷移時間
- **バンドルサイズ**: 各チャンクのサイズと最適化効果

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 依存関係の問題

```bash
npm run clean
npm run install:all
npm run setup
```

#### 型エラー

```bash
npm run typecheck
```

#### ポート競合

各プロジェクトの `vite.config.ts` でポート番号を変更

#### ビルドエラー

```bash
# プロジェクト個別でのデバッグ
cd react-router && npm run build
cd tanstack-router && npm run build
```

## 📝 注意事項

- **測定環境**: ネットワーク条件や実行環境により結果は変動します
- **再現性**: 複数回測定して平均値を取ることを推奨します
- **キャッシュ**: 正確な測定のためブラウザキャッシュをクリアしてください
- **開発モード**: 本番環境での性能を測定する場合は `build` 後のファイルを使用してください

## 📚 参考資料

- [React Router v7 Documentation](https://reactrouter.com/)
- [Tanstack Router Documentation](https://tanstack.com/router/)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 コントリビューション

パフォーマンス改善の提案やバグ報告は、Issue またはプルリクエストでお願いします。
