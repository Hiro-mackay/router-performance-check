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

#### 1. ビルド時間・バンドルサイズ測定

```bash
npm run test:performance
```

このコマンドは以下を実行します：

- 両プロジェクトの自動ビルド
- ビルド時間の測定・比較
- バンドルサイズの分析・比較
- 結果のコンソール出力

#### 2. ブラウザベース実行性能測定 ⚡ **推奨**

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# ブラウザ自動化テストを実行
npm run test:performance:browser
```

このコマンドは**実際のブラウザ**で以下を測定します：

- **実際のページロード時間**
- **DOM Content Loaded 時間**
- **First Contentful Paint (FCP)**
- **Largest Contentful Paint (LCP)**
- **ネットワーク転送サイズ**
- **クライアントサイドナビゲーション性能**
- **複数回測定での平均値算出**

> **注意**: ブラウザテストの前に `npm run dev` で両方のサーバーを起動してください。

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
├── latest-results.json              # ビルド時間・バンドルサイズ結果
├── latest-browser-results.json     # ブラウザ実行性能結果 ⭐
├── results-[timestamp].json        # ビルド結果タイムスタンプ付き履歴
├── browser-results-[timestamp].json # ブラウザ結果タイムスタンプ付き履歴
├── react-router-stats.html         # React Routerバンドル分析
└── tanstack-router-stats.html      # Tanstack Routerバンドル分析
```

**推奨**: `latest-browser-results.json` が実際のユーザー体験に最も近い結果を提供します。

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

### 測定手法の比較

| 測定方法                | 長所                                   | 短所                 | 使用場面         |
| ----------------------- | -------------------------------------- | -------------------- | ---------------- |
| **ブラウザ自動測定** ⭐ | 実際のユーザー体験、Web Vitals、自動化 | セットアップが必要   | **実用性能評価** |
| **ビルド時測定**        | 簡単、CI/CD 統合しやすい               | 実行性能が分からない | 開発効率評価     |
| **手動 DevTools**       | 詳細分析可能                           | 手間、再現性低い     | 詳細デバッグ     |

### 推奨測定フロー

1. **`npm run test:performance:browser`** - 実際の性能比較
2. **`npm run test:performance`** - ビルド効率比較
3. **手動 DevTools** - 問題の詳細分析

### 測定前の準備

1. ブラウザキャッシュをクリア（自動化テストでは自動実行）
2. ネットワーク条件を統一
3. 複数回測定して平均値を算出（自動化テストでは標準で 3 回実行）

### 重要な測定項目

- **Total Load Time**: 実際のページロード時間
- **DOM Content Loaded**: DOM の読み込み完了時間
- **First Contentful Paint (FCP)**: 最初のコンテンツ表示時間
- **Largest Contentful Paint (LCP)**: メインコンテンツの表示時間
- **Network Transfer Size**: 実際のデータ転送量
- **Navigation Performance**: SPA 内でのページ遷移時間

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
