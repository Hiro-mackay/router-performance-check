# Router Performance Check 完全利用ガイド

> **このガイドについて**: Router Performance Check プロジェクトで実装された改善の全体像と、効果的な利用方法を包括的に説明します。

## 📋 目次

1. [プロジェクト概要](#-プロジェクト概要)
2. [改善された測定システム](#-改善された測定システム)
3. [クイックスタート](#-クイックスタート)
4. [測定結果の見方](#-測定結果の見方)
5. [ベストプラクティス](#-ベストプラクティス)
6. [トラブルシューティング](#-トラブルシューティング)
7. [高度な利用方法](#-高度な利用方法)

## 🎯 プロジェクト概要

### 目的

React Router v7 と TanStack Router の性能を **正確に** 比較し、実際のユーザー体験に基づいた判断材料を提供する。

### 解決した問題

**従来の問題:**

- バンドルサイズ測定のみ → 実際の性能と乖離
- 結果ファイルが散乱 → どれを見るべきか不明瞭
- 手動測定に依存 → 再現性と効率性の問題

**解決策:**

- ✅ ブラウザベース自動測定システム
- ✅ 明瞭なファイル構造
- ✅ 包括的なドキュメント

## 🚀 改善された測定システム

### 測定手法の比較

| 測定方法             | 従来        | 改善後      | 適用場面                   |
| -------------------- | ----------- | ----------- | -------------------------- |
| **ブラウザ実行性能** | ❌ 手動のみ | ✅ 自動化   | **実際のユーザー体験評価** |
| **ビルド性能**       | ✅ 自動化   | ✅ 改善済み | 開発効率性評価             |
| **結果管理**         | ❌ 混乱     | ✅ 明瞭化   | 継続的な改善追跡           |

### 新しい測定システムの特徴

#### 1. ブラウザベース自動測定 ⭐ **推奨**

```bash
npm run test:performance:browser
```

**測定項目:**

- ✅ 実際のページロード時間
- ✅ DOM Content Loaded 時間
- ✅ Web Vitals (FCP, LCP)
- ✅ ネットワーク転送サイズ
- ✅ クライアントサイドナビゲーション性能
- ✅ 3 回測定での平均値算出

#### 2. ビルド性能測定

```bash
npm run test:performance
```

**測定項目:**

- ✅ ビルド時間比較
- ✅ 総バンドルサイズ
- ✅ JavaScript/CSS ファイルサイズ
- ✅ バンドル分析レポート生成

## 🎬 クイックスタート

### 初回セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. プロジェクト初期化
npm run setup

# 3. 開発サーバー起動（別ターミナル）
npm run dev
```

### 基本的な性能測定

```bash
# 最重要: ブラウザ実行性能測定
npm run test:performance:browser

# 補助: ビルド性能測定
npm run test:performance
```

### 結果の確認

```bash
# 最新のブラウザ性能結果（最重要）
cat performance-results/latest-browser-performance.json

# 結果の見方説明
cat performance-results/README.md
```

## 📊 測定結果の見方

### ファイル構造の理解

```bash
performance-results/
├── 📄 latest-browser-performance.json      # ⭐ 最重要: 実際の性能
├── 📄 latest-build-performance.json        # 📊 補助: ビルド性能
├── 📄 react-router-bundle-stats.html       # 🔍 詳細: バンドル分析
├── 📄 tanstack-router-bundle-stats.html    # 🔍 詳細: バンドル分析
├── 📄 README.md                            # 📖 ガイド: 使い方
└── 📁 history/                             # 📚 履歴管理
    ├── 📁 browser/                         # ブラウザ測定履歴
    └── 📁 build/                           # ビルド測定履歴
```

### 重要な指標の解釈

#### ブラウザ性能結果 (latest-browser-performance.json)

```json
{
  "comparison": {
    "loadTimeWinner": "TanStack Router", // ページロード勝者
    "loadTimeDifference": 693.67, // 差分（ms）
    "transferSizeWinner": "React Router", // データ転送勝者
    "navigationWinner": "React Router" // ナビゲーション勝者
  }
}
```

**判断基準:**

| 指標                       | 重要度 | 理由                       |
| -------------------------- | ------ | -------------------------- |
| **Total Load Time**        | ⭐⭐⭐ | 実際のユーザー待機時間     |
| **Transfer Size**          | ⭐⭐   | モバイル環境での重要性     |
| **Navigation Performance** | ⭐⭐   | SPA 体験の快適さ           |
| **Bundle Size**            | ⭐     | 参考程度（実行性能とは別） |

### 実際の測定例

**最新測定結果（2025 年 8 月 7 日）:**

| 項目               | React Router   | TanStack Router | 勝者                |
| ------------------ | -------------- | --------------- | ------------------- |
| **ページロード**   | 5,627ms        | **4,934ms** ⚡  | **TanStack Router** |
| **データ転送**     | **5.95KB** ⚡  | 10.25KB         | **React Router**    |
| **ナビゲーション** | **1,039ms** ⚡ | 1,079ms         | **React Router**    |

**結論**: TanStack Router は初回ロードが高速、React Router はデータ効率とナビゲーションが優秀

## 🎯 ベストプラクティス

### 測定の実行手順

#### 1. 環境の準備

```bash
# ブラウザキャッシュクリア（推奨）
# - Chrome: Cmd+Shift+R (macOS) / Ctrl+Shift+R (Windows)
# - 開発者ツール > Application > Storage > Clear storage

# 他のアプリケーション終了（推奨）
# - 測定の精度向上のため
```

#### 2. 測定実行

```bash
# 開発サーバー起動（別ターミナル）
npm run dev

# ブラウザ測定実行
npm run test:performance:browser

# 必要に応じてビルド測定も実行
npm run test:performance
```

#### 3. 結果確認

```bash
# 最重要結果を確認
cat performance-results/latest-browser-performance.json

# 必要に応じて詳細分析
open performance-results/react-router-bundle-stats.html
open performance-results/tanstack-router-bundle-stats.html
```

### 継続的な性能監視

#### 測定タイミング

1. **新機能追加後** - 必須
2. **依存関係更新後** - 推奨
3. **定期測定** - 月 1 回程度

#### 履歴の活用

```bash
# 過去の結果と比較
ls performance-results/history/browser/
ls performance-results/history/build/

# トレンドの確認
# 定期的に過去の結果と比較して性能の変化を追跡
```

### 結果の解釈指針

#### 判断の優先順位

1. **Total Load Time** → ユーザー体験への直接的影響
2. **Transfer Size** → モバイル・低速回線での影響
3. **Navigation Performance** → SPA 使用時の快適さ
4. **Bundle Size** → 参考情報として

#### 許容範囲の目安

| 指標              | 良好    | 許容   | 要改善    |
| ----------------- | ------- | ------ | --------- |
| **Page Load**     | < 3 秒  | < 5 秒 | 5 秒以上  |
| **Transfer Size** | < 10KB  | < 20KB | 20KB 以上 |
| **Navigation**    | < 500ms | < 1 秒 | 1 秒以上  |

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. サーバーが起動しない

```bash
# エラー例
❌ Server at http://localhost:5173 is not ready after 30 retries

# 解決策
npm run dev:react-router    # React Routerのみ起動
npm run dev:tanstack-router # TanStack Routerのみ起動

# ポート確認
lsof -i :5173
lsof -i :3000
```

#### 2. 依存関係の問題

```bash
# クリーンインストール
npm run clean
npm run install:all
npm run setup

# 個別確認
cd react-router && npm install
cd tanstack-router && npm install
```

#### 3. 測定結果が大きく変動する

**原因:**

- ネットワーク状況の変化
- システム負荷の変動
- ブラウザの状態

**対策:**

```bash
# 複数回実行して平均値を確認
npm run test:performance:browser
# (数分後)
npm run test:performance:browser
# (さらに数分後)
npm run test:performance:browser

# 履歴ファイルで安定性を確認
ls performance-results/history/browser/
```

#### 4. Puppeteer の問題

```bash
# Puppeteerを再インストール
npm uninstall puppeteer
npm install puppeteer

# システム要件確認
# - Node.js 16以上
# - 十分なメモリ（8GB以上推奨）
```

### デバッグモード

#### 詳細ログの有効化

```javascript
// browser-performance-test.js を一時的に編集
const browser = await puppeteer.launch({
  headless: false, // ブラウザを表示
  devtools: true, // 開発者ツールを表示
});
```

#### 手動測定での検証

```bash
# 開発サーバー起動
npm run dev

# ブラウザで手動確認
# 1. localhost:5173/posts にアクセス
# 2. 開発者ツール > Network タブで測定
# 3. localhost:3000/posts で同様に測定
# 4. 結果を自動測定と比較
```

## 🔬 高度な利用方法

### カスタム測定の実装

#### 新しい測定項目の追加

```javascript
// browser-performance-test.js の拡張例
async function measureCustomMetrics(page) {
  // カスタムメトリクスの測定
  const customMetrics = await page.evaluate(() => {
    // Time to Interactive (TTI)
    const tti = performance.getEntriesByType("navigation")[0].loadEventEnd;

    // Total Blocking Time (TBT)
    const longTasks = performance.getEntriesByType("longtask");
    const tbt = longTasks.reduce((sum, task) => sum + task.duration, 0);

    return { tti, tbt };
  });

  return customMetrics;
}
```

#### 特定条件での測定

```bash
# 低速ネットワークシミュレーション
# browser-performance-test.js に以下を追加:
await page.emulateNetworkConditions({
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8,  // 1.5 Mbps
  uploadThroughput: 750 * 1024 / 8,            // 750 Kbps
  latency: 40,                                 // 40ms
});
```

### CI/CD 統合

#### GitHub Actions での自動測定

```yaml
# .github/workflows/performance.yml
name: Performance Test
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run setup
      - run: npm run dev &
      - run: sleep 30 # サーバー起動待ち
      - run: npm run test:performance:browser
      - uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/
```

#### 性能劣化の自動検出

```javascript
// performance-regression-check.js (今後の実装案)
const previousResults = require("./performance-results/history/browser/latest.json");
const currentResults = require("./performance-results/latest-browser-performance.json");

const REGRESSION_THRESHOLD = 1.2; // 20%以上の劣化で警告

function checkRegression(previous, current) {
  const loadTimeRegression = current.totalLoadTime / previous.totalLoadTime;

  if (loadTimeRegression > REGRESSION_THRESHOLD) {
    console.error(
      `⚠️ Performance regression detected: ${loadTimeRegression.toFixed(
        2
      )}x slower`
    );
    process.exit(1);
  }
}
```

### 高度な分析

#### 統計的分析

```javascript
// 測定データの統計分析（今後の実装案）
function analyzePerformanceData(historyDir) {
  const files = fs.readdirSync(historyDir);
  const data = files.map((file) => require(path.join(historyDir, file)));

  // 平均値・標準偏差・トレンド分析
  const stats = {
    mean: calculateMean(data),
    stdDev: calculateStandardDeviation(data),
    trend: calculateTrend(data),
  };

  return stats;
}
```

#### パフォーマンス予測

```javascript
// 将来的な実装: 機械学習による性能予測
function predictPerformance(historicalData, featureChanges) {
  // 過去のデータとコード変更量から性能を予測
  // 重要な変更前の事前評価に活用
}
```

## 📈 今後の拡張計画

### 短期的な改善 (1-3 ヶ月)

1. **Lighthouse 統合**

   ```bash
   npm run test:performance:lighthouse
   ```

2. **モバイル性能測定**

   ```bash
   npm run test:performance:mobile
   ```

3. **パフォーマンスレポート生成**
   ```bash
   npm run generate:performance-report
   ```

### 中期的な改善 (3-6 ヶ月)

1. **リアルタイム監視**
2. **A/B テスト機能**
3. **パフォーマンスバジェット設定**

### 長期的な改善 (6 ヶ月以上)

1. **本番環境監視統合**
2. **ユーザー行動分析**
3. **予測的性能分析**

## 🎉 まとめ

### このガイドで学んだこと

1. **正確な測定の重要性**: バンドルサイズ ≠ 実際の性能
2. **自動化の価値**: 継続的で信頼性の高い測定
3. **結果管理の重要性**: 明瞭な構造による効率化
4. **継続的改善**: 履歴の活用による長期的な最適化

### 推奨アクションプラン

#### 日常の開発フロー

1. 新機能開発前に現在の性能を測定
2. 開発後に再測定して影響を確認
3. 重要な変更時は履歴として保存

#### 定期的なメンテナンス

1. 月 1 回の定期測定実行
2. 四半期ごとの履歴分析
3. 年 1 回のシステム全体見直し

#### 問題発生時の対応

1. まず `latest-browser-performance.json` を確認
2. 詳細が必要なら bundle-stats.html を分析
3. 過去の履歴と比較して原因を特定

**最終的な目標**: 実際のユーザー体験に基づいた、継続的で客観的な性能改善サイクルの確立

---

## 📚 関連ドキュメント

- [Performance Measurement Improvements](./performance-measurement-improvements.md) - 改善の詳細な分析
- [Browser-based Performance Testing](./browser-based-performance-testing.md) - 技術実装の詳細
- [File Structure Optimization](./file-structure-optimization.md) - ファイル構造の改善詳細

**困った時は**: `performance-results/README.md` を確認するか、上記の詳細ドキュメントを参照してください。
