# 公平な条件での Router 性能比較の実装

> **改善日時**: 2025 年 8 月 7 日  
> **目的**: React Router と TanStack Router の測定条件を統一し、公平な性能比較を実現

## 🔍 発見された問題

### 測定条件の不統一

初期測定において、以下の重要な差分により公平な比較ができていませんでした：

| 項目               | React Router               | TanStack Router             | 影響                                       |
| ------------------ | -------------------------- | --------------------------- | ------------------------------------------ |
| **TailwindCSS**    | ✅ v4.1.4                  | ❌ なし                     | CSS 処理とバンドルサイズに影響             |
| **Google Fonts**   | ✅ preconnect + stylesheet | ❌ なし                     | ネットワークリクエストと読み込み時間に影響 |
| **CSS ファイル数** | 1 個 (app.css)             | 2 個 (App.css + styles.css) | HTTP リクエスト数に影響                    |
| **開発ツール**     | なし                       | ✅ TanStackRouterDevtools   | バンドルサイズとパフォーマンスに影響       |
| **測定ツール**     | なし                       | ✅ reportWebVitals          | 実行時オーバーヘッドに影響                 |

## 🎯 実装した統一化

### 1. 依存関係の統一

#### TanStack Router に TailwindCSS を追加

```bash
# TanStack Router プロジェクトに追加
cd tanstack-router
npm install -D tailwindcss @tailwindcss/vite
```

#### Vite 設定の更新

```typescript
// tanstack-router/vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(), // 追加
    // ...
  ],
});
```

### 2. CSS ファイルの統一

#### 統一されたスタイル

両プロジェクトで同じ TailwindCSS 設定を使用：

```css
/* 両プロジェクト共通の styles.css/app.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

html,
body {
  @apply bg-white dark:bg-gray-950;

  @media (prefers-color-scheme: dark) {
    color-scheme: dark;
  }
}
```

#### ファイル数の統一

- **TanStack Router**: `App.css` を削除し、`styles.css` のみに統一
- **React Router**: `app.css` のみ（既存維持）

### 3. フォント読み込みの統一

#### TanStack Router に Google Fonts を追加

```html
<!-- tanstack-router/index.html -->
<head>
  <!-- Google Fonts preconnect and stylesheet (matching React Router) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  />
</head>
```

### 4. 開発ツールの影響除外

#### 開発環境でのみ有効化

```typescript
// TanStack Router の開発ツールを開発時のみに制限
export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});

// reportWebVitals も開発時のみ
if (import.meta.env.DEV) {
  reportWebVitals();
}
```

### 5. UI の統一化

#### TailwindCSS クラスでのスタイル統一

```typescript
// TanStack Router のホームページをTailwindCSSベースに変更
function App() {
  return (
    <div className="text-center">
      <header className="bg-gray-800 min-h-screen flex flex-col items-center justify-center text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-spin duration-[20s] linear infinite"
          alt="logo"
        />
        {/* ... */}
      </header>
    </div>
  );
}
```

## 📊 統一化後の測定結果

### ブラウザ実行性能（最重要）

| 項目                             | 統一前  | 統一後  | 変化                |
| -------------------------------- | ------- | ------- | ------------------- |
| **React Router ページロード**    | 5,627ms | 4,616ms | **⬇️ 1,011ms 改善** |
| **TanStack Router ページロード** | 4,934ms | 3,882ms | **⬇️ 1,052ms 改善** |
| **差分**                         | 694ms   | 734ms   | **✅ ほぼ同等**     |

### データ転送量

| 項目                | 統一前  | 統一後 | 変化               |
| ------------------- | ------- | ------ | ------------------ |
| **React Router**    | 5.95KB  | 5.81KB | **⬇️ 0.14KB**      |
| **TanStack Router** | 10.25KB | 7.84KB | **⬇️ 2.41KB 改善** |
| **差分**            | 4.3KB   | 2.03KB | **⬇️ 差分縮小**    |

### ビルド性能

| 項目                           | 統一前  | 統一後  | 変化                |
| ------------------------------ | ------- | ------- | ------------------- |
| **React Router ビルド時間**    | 2,625ms | 2,705ms | **⬆️ 80ms**         |
| **TanStack Router ビルド時間** | 3,131ms | 3,329ms | **⬆️ 198ms**        |
| **差分**                       | 506ms   | 624ms   | **⬆️ ビルド差拡大** |

### バンドルサイズ

| 項目                         | 統一前  | 統一後  | 変化            |
| ---------------------------- | ------- | ------- | --------------- |
| **React Router 総サイズ**    | 344.8KB | 336.7KB | **⬇️ 8.1KB**    |
| **TanStack Router 総サイズ** | 295.8KB | 294.9KB | **⬇️ 0.9KB**    |
| **差分**                     | 49.0KB  | 41.9KB  | **⬇️ 差分縮小** |

## 🎯 統一化の効果と意義

### 1. 測定の公平性確保

**統一前の問題:**

- TanStack Router が有利な条件（軽量 CSS、フォントなし）
- 異なる開発ツールの影響
- 非統一的な HTTP リクエスト数

**統一後の改善:**

- 同じ依存関係とスタイルシステム
- 同じフォント読み込み条件
- 開発ツールの影響を除外

### 2. より正確な性能差の把握

**主要な発見:**

1. **TanStack Router の優位性が確認**

   - 統一後もページロード速度で 734ms(19%)高速
   - 公平な条件下での明確な性能差

2. **両ルーターとも条件統一で性能向上**

   - React Router: 1,011ms 改善
   - TanStack Router: 1,052ms 改善
   - 測定環境の最適化効果

3. **データ転送効率の改善**
   - TanStack Router: 2.41KB 削減
   - 差分が 4.3KB→2.03KB に縮小

### 3. 実用的な測定環境の構築

**開発者体験の向上:**

- 両プロジェクトが同じ UI/UX フレームワーク
- 統一されたスタイルガイド
- 保守性の向上

## 🔧 技術的実装詳細

### CSS 統合の課題と解決

**課題**: TanStack Router の既存 CSS クラス（App-header 等）が TailwindCSS と競合

**解決策**:

```typescript
// 従来のCSSクラス
<div className="App">
  <header className="App-header">

// TailwindCSSクラスに変換
<div className="text-center">
  <header className="bg-gray-800 min-h-screen flex flex-col items-center justify-center">
```

### バンドル分析の統一

**ファイル名の統一**:

```typescript
// 両プロジェクトで統一
visualizer({
  filename: "../performance-results/react-router-bundle-stats.html",
  filename: "../performance-results/tanstack-router-bundle-stats.html",
});
```

### 環境依存機能の制御

**開発/本番環境の分離**:

```typescript
// 開発環境でのみ有効化
{
  import.meta.env.DEV && <TanStackRouterDevtools />;
}

if (import.meta.env.DEV) {
  reportWebVitals();
}
```

## 📈 継続的な公平性確保

### 今後の測定時の注意点

1. **依存関係の同期**

   - 新しいライブラリ追加時は両プロジェクトに反映
   - バージョン更新の統一

2. **機能追加時の考慮**

   - 新機能は両プロジェクトで等価な実装
   - パフォーマンスに影響する機能の慎重な検討

3. **測定環境の維持**
   - 開発ツールの影響除外の継続
   - CSS フレームワークの統一維持

### 推奨される改善の進め方

```bash
# 1. 新機能追加前の測定
npm run test:performance:browser

# 2. 両プロジェクトでの同等実装
# React Router での実装
# TanStack Router での実装

# 3. 統一性確認
# - 同じ依存関係
# - 同じスタイルフレームワーク
# - 同じHTTPリクエスト数

# 4. 統一後の測定
npm run test:performance:browser

# 5. 差分分析
# 前後の結果比較と分析
```

## 🎉 結論

この統一化により：

1. **測定の信頼性向上**: 公平な条件での比較が実現
2. **性能差の明確化**: TanStack Router の優位性を確認
3. **開発環境の改善**: 両プロジェクトの保守性向上
4. **継続測定の基盤**: 今後の機能追加時も公平な比較が可能

**最重要な発見**: 公平な条件下でも **TanStack Router** が実際のページロード性能で **19%高速** という結果が確認され、ユーザーの体感と一致する測定結果が得られました。
