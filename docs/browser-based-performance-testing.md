# ブラウザベース パフォーマンス測定システム

> **新機能**: `npm run test:performance:browser`  
> **目的**: 実際のブラウザでの性能を自動測定し、正確なユーザー体験を反映

## 🎯 概要

従来のビルド時間・バンドルサイズ測定では実際のユーザー体験を反映できないため、Puppeteer を使用した実ブラウザ測定システムを導入しました。

## 🚀 実行方法

### 基本実行

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# ブラウザ自動化テストを実行
npm run test:performance:browser
```

### 必要な前提条件

1. **両方の開発サーバーが起動中**

   - React Router: `localhost:5173`
   - TanStack Router: `localhost:3000`

2. **依存関係がインストール済み**
   ```bash
   npm install  # Puppeteerが自動インストールされる
   ```

## 📊 測定項目

### Core Web Vitals & Performance Metrics

| 項目                               | 説明                   | 重要度 |
| ---------------------------------- | ---------------------- | ------ |
| **Total Load Time**                | ページ全体のロード時間 | ⭐⭐⭐ |
| **DOM Content Loaded**             | DOM 構築完了時間       | ⭐⭐⭐ |
| **First Contentful Paint (FCP)**   | 最初のコンテンツ表示   | ⭐⭐   |
| **Largest Contentful Paint (LCP)** | メインコンテンツ表示   | ⭐⭐⭐ |
| **Network Requests**               | リクエスト数           | ⭐     |
| **Total Transfer Size**            | 実際のデータ転送量     | ⭐⭐   |
| **JavaScript Size**                | JS ファイルサイズ      | ⭐⭐   |
| **CSS Size**                       | CSS ファイルサイズ     | ⭐     |
| **Navigation Performance**         | SPA 内ページ遷移時間   | ⭐⭐   |

### 測定の信頼性確保

- **3 回測定の平均値**: 環境変動を吸収
- **キャッシュ無効化**: 毎回クリーンな状態で測定
- **ネットワーク待機**: `networkidle0`で完全ロード確認

## 🔧 技術実装詳細

### 測定システムアーキテクチャ

```javascript
// メイン測定フロー
async function measurePagePerformance(url, pageName, iterations = 3) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    // 1. ブラウザ起動とページ設定
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setCacheEnabled(false); // キャッシュ無効化

    // 2. パフォーマンス監視開始
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");
    await client.send("Performance.enable");

    // 3. ネットワーク監視
    client.on("Network.responseReceived", (params) => {
      // リクエストサイズ・タイプを記録
      trackNetworkMetrics(params);
    });

    // 4. ページロードと測定
    const startTime = Date.now();
    await page.goto(url, { waitUntil: "networkidle0" });

    // 5. Web Vitals取得
    const webVitals = await getWebVitals(page);

    // 6. 結果記録
    results.push({
      totalLoadTime: Date.now() - startTime,
      ...webVitals,
      ...networkMetrics,
    });

    await browser.close();
  }

  // 7. 平均値計算
  return calculateAverages(results);
}
```

### Web Vitals 測定

```javascript
// ブラウザ内でのWeb Vitals取得
const webVitals = await page.evaluate(() => {
  return new Promise((resolve) => {
    const vitals = {};

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        vitals.largestContentfulPaint = entries[entries.length - 1].startTime;
      }
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        vitals.firstContentfulPaint = entries[0].startTime;
      }
    }).observe({ entryTypes: ["paint"] });

    // 測定完了まで待機
    setTimeout(() => resolve(vitals), 2000);
  });
});
```

### ネットワーク監視

```javascript
// リアルタイムネットワーク監視
client.on("Network.responseReceived", (params) => {
  const response = params.response;

  // 総転送サイズ
  totalTransferSize += response.encodedDataLength || 0;

  // ファイルタイプ別サイズ
  if (response.mimeType?.includes("javascript")) {
    jsSize += response.encodedDataLength || 0;
  } else if (response.mimeType?.includes("css")) {
    cssSize += response.encodedDataLength || 0;
  }

  // リクエスト記録
  networkRequests.push({
    url: response.url,
    status: response.status,
    mimeType: response.mimeType,
    size: response.encodedDataLength || 0,
  });
});
```

## 📁 結果ファイル

### 保存場所

```bash
# 最新結果（メイン）
performance-results/latest-browser-performance.json

# 履歴
performance-results/history/browser/browser-results-[timestamp].json
```

### 結果フォーマット

```json
{
  "timestamp": "2025-08-07T12:41:44.185Z",
  "testType": "browser-based",
  "reactRouter": {
    "url": "http://localhost:5173/posts",
    "pageLoad": {
      "totalLoadTime": 5627.33,
      "domContentLoaded": 0,
      "firstContentfulPaint": 0,
      "largestContentfulPaint": 0,
      "networkRequests": 21,
      "totalTransferSize": 5953,
      "jsSize": 4809,
      "cssSize": 446,
      "iterations": 3
    },
    "navigation": 1039
  },
  "tanstackRouter": {
    "url": "http://localhost:3000/posts",
    "pageLoad": {
      "totalLoadTime": 4933.67,
      "domContentLoaded": 0.03,
      "firstContentfulPaint": 0,
      "largestContentfulPaint": 0,
      "networkRequests": 32,
      "totalTransferSize": 10250,
      "jsSize": 7827,
      "cssSize": 0,
      "iterations": 3
    },
    "navigation": 1079
  },
  "comparison": {
    "loadTimeWinner": "TanStack Router",
    "loadTimeDifference": 693.67,
    "transferSizeWinner": "React Router",
    "transferSizeDifference": 4297,
    "navigationWinner": "React Router"
  }
}
```

## 🎯 測定結果の解釈

### 重要な指標の見方

1. **Total Load Time**

   - **最重要指標**: 実際のユーザー待機時間
   - **許容範囲**: 3 秒以下が理想

2. **Largest Contentful Paint (LCP)**

   - **Web Vitals の核心**: Google も重視
   - **許容範囲**: 2.5 秒以下

3. **Total Transfer Size**

   - **ネットワーク効率**: モバイル環境で重要
   - **考慮事項**: サイズ vs 機能のトレードオフ

4. **Navigation Performance**
   - **SPA 体験**: ページ遷移の快適さ
   - **理想値**: 500ms 以下

### 勝者判定ロジック

```javascript
// 自動勝者判定
const comparison = {
  loadTimeWinner: reactTime < tanstackTime ? "React Router" : "TanStack Router",
  loadTimeDifference: Math.abs(reactTime - tanstackTime),
  transferSizeWinner:
    reactSize < tanstackSize ? "React Router" : "TanStack Router",
  transferSizeDifference: Math.abs(reactSize - tanstackSize),
  navigationWinner: reactNav < tanstackNav ? "React Router" : "TanStack Router",
};
```

## ⚠️ 制限事項と注意点

### 環境による変動

- **ネットワーク条件**: WiFi の状態により結果が変動
- **システム負荷**: CPU やメモリ使用量の影響
- **ブラウザ状態**: 他のタブやプロセスの影響

### 測定の制限

- **開発環境での測定**: 本番環境とは異なる
- **シンプルなページ**: 複雑なアプリケーションでは結果が変わる可能性
- **キャッシュ無効**: 実際のユーザーはキャッシュを使用

### 推奨される対応

1. **複数回実行**: 1 回の結果で判断しない
2. **環境の統一**: 測定時の条件を可能な限り統一
3. **本番環境確認**: 最終的には本番環境での確認が必要

## 🔄 継続的な改善

### 測定頻度

- **新機能追加時**: 必ず測定
- **依存関係更新時**: 性能への影響確認
- **定期測定**: 月 1 回程度

### 履歴の活用

```bash
# 履歴ファイルで変化を追跡
ls performance-results/history/browser/

# 過去の結果と比較
diff latest-browser-performance.json history/browser/browser-results-*.json
```

### アラート設定（今後の拡張）

```javascript
// 性能劣化の自動検出（将来的な実装案）
const PERFORMANCE_THRESHOLDS = {
  loadTime: 6000, // 6秒以上は警告
  transferSize: 15000, // 15KB以上は警告
  navigation: 1500, // 1.5秒以上は警告
};

function checkPerformanceRegression(current, previous) {
  // 前回比で大幅な劣化があれば警告
}
```

## 🎉 まとめ

このブラウザベース測定システムにより：

1. **正確な性能測定**: 実際のユーザー体験を反映
2. **自動化の実現**: 手動作業からの解放
3. **継続的な監視**: 履歴管理による変化の追跡
4. **信頼性の向上**: 複数回測定による安定した結果

**重要**: このシステムは開発環境での相対比較に適している。本番環境の絶対的な性能値とは異なることに注意。
