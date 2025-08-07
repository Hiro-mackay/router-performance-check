# 📊 パフォーマンス測定結果

このディレクトリには、React Router v7 と TanStack Router のパフォーマンス比較結果が保存されています。

## 🎯 最新結果（必ず確認）

### ⚡ **ブラウザ実行性能** （最重要）

```
📄 latest-browser-performance.json
```

**実際のブラウザでの性能測定結果**

- ページロード時間
- DOM Content Loaded 時間
- Web Vitals (FCP, LCP)
- ネットワーク転送サイズ
- クライアントサイドナビゲーション性能

### 🏗️ **ビルド性能**

```
📄 latest-build-performance.json
```

**ビルド時間とバンドルサイズの比較**

- ビルド時間
- 総バンドルサイズ
- JavaScript/CSS ファイルサイズ

## 📈 バンドル分析

### React Router

```
📄 react-router-bundle-stats.html
```

Webpack Bundle Analyzer による詳細な依存関係とサイズ分析

### TanStack Router

```
📄 tanstack-router-bundle-stats.html
```

Webpack Bundle Analyzer による詳細な依存関係とサイズ分析

## 📁 履歴データ

### ブラウザ測定履歴

```
history/browser/
├── browser-results-2025-08-07T12-41-44-186Z.json
└── browser-results-2025-08-07T12-40-41-754Z.json
```

### ビルド測定履歴

```
history/build/
└── build-2025-08-07T12-22-36.json
```

## 🚀 測定コマンド

### 新しい測定を実行

```bash
# ブラウザ実行性能測定（推奨）
npm run test:performance:browser

# ビルド性能測定
npm run test:performance
```

## 📖 結果の見方

### ブラウザ性能結果 (latest-browser-performance.json)

```json
{
  "comparison": {
    "loadTimeWinner": "TanStack Router", // ページロード勝者
    "loadTimeDifference": 693.67, // 差分（ms）
    "transferSizeWinner": "React Router", // データ転送量勝者
    "navigationWinner": "React Router" // ナビゲーション勝者
  }
}
```

### 重要な指標

1. **Total Load Time**: 実際のページロード時間
2. **Network Transfer Size**: 実際のダウンロードサイズ
3. **Navigation Performance**: SPA 内のページ遷移速度
4. **DOM Content Loaded**: DOM 読み込み完了時間

## ⚠️ 注意事項

- **ブラウザ性能結果が最も重要**: 実際のユーザー体験を反映
- **複数回測定の平均**: 自動的に 3 回測定して平均値を算出
- **環境依存**: ネットワーク条件や実行環境により結果は変動
- **履歴比較**: 履歴データで性能の変化を追跡可能

## 🎯 推奨アクション

1. 📄 **`latest-browser-performance.json`** を最初に確認
2. 🔍 詳細が必要な場合は **バンドル分析 HTML** を確認
3. 📈 継続的な改善のため **履歴データ** と比較
4. 🚀 新機能追加後は **再測定** を実行
