# Router Performance Comparison

React Router v7 と Tanstack Router のパフォーマンスを比較するためのプロジェクトです。

## 📁 プロジェクト構成

```
router-performance-check/
├── 📁 react-router/          # React Router v7プロジェクト
├── 📁 tanstack-router/       # Tanstack Routerプロジェクト
├── 📁 scripts/               # セットアップ・ユーティリティスクリプト
├── 📄 package.json          # オーケストレーション用スクリプト
└── 📄 .gitignore            # 統合gitignore設定
```

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

## 🛠️ 技術スタック

### React Router v7

- **特徴**: サーバーサイドレンダリング、自動コード分割、型安全性
- **ポート**: 5173
- **ビルドツール**: Vite

### Tanstack Router

- **特徴**: 高度な型推論、柔軟なローダー設計、自動コード分割
- **ポート**: 3000
- **ビルドツール**: Vite

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

## 📚 参考資料

- [React Router v7 Documentation](https://reactrouter.com/)
- [Tanstack Router Documentation](https://tanstack.com/router/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 コントリビューション

パフォーマンス改善の提案やバグ報告は、Issue またはプルリクエストでお願いします。
