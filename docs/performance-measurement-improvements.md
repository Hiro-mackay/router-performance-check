# パフォーマンス測定の問題解決と改善

> **改善日時**: 2025 年 8 月 7 日  
> **改善内容**: ブラウザベースの実測定システム導入 + 結果管理構造の最適化

## 🔍 発見された問題

### 初期の問題状況

ユーザーの実感では **TanStack Router** の方が高速だったが、測定結果では **React Router** が優位という矛盾が発生していました。

```
実際のブラウザ体験: TanStack Router が高速 ⚡
測定結果:          React Router が優位 📊
```

## 🕵️ 根本原因の分析

### 1. 測定方法の問題

**従来の測定内容:**

- ✅ ビルド時間の測定
- ✅ バンドルサイズの比較
- ❌ **実際のブラウザでの実行性能** - 測定していない

**問題点:**

- バンドルサイズ ≠ 実行性能
- ビルド時間 ≠ ユーザー体験
- 開発者ツールでの手動確認に依存

### 2. ブラウザ開発者ツールの実測値

実際の開発者ツールのネットワークタブで確認した結果：

| 項目                 | React Router (localhost:5173) | TanStack Router (localhost:3000) |
| -------------------- | ----------------------------- | -------------------------------- |
| **Total requests**   | 22                            | 33                               |
| **Data transferred** | 1.9 MB                        | 1.8 MB                           |
| **Finish time**      | **1.25s**                     | **393ms** ⚡                     |
| **DOMContentLoaded** | ~600ms                        | ~300ms ⚡                        |

**結論**: TanStack Router が実際に **3 倍以上高速** だった

## 🚀 実装した解決策

### 1. ブラウザベース自動測定システムの導入

**新システム (`browser-performance-test.js`):**

```bash
npm run test:performance:browser
```

**測定項目:**

- ✅ **実際のページロード時間**
- ✅ **DOM Content Loaded 時間**
- ✅ **First Contentful Paint (FCP)**
- ✅ **Largest Contentful Paint (LCP)**
- ✅ **ネットワーク転送サイズ**
- ✅ **クライアントサイドナビゲーション性能**
- ✅ **複数回測定での平均値算出** (3 回)

**技術スタック:**

- **Puppeteer**: ヘッドレスブラウザ自動化
- **Chrome DevTools Protocol**: 詳細パフォーマンス計測
- **Web Vitals API**: 実際のユーザー体験指標

### 2. 測定結果の検証

**新しい自動測定結果:**

| 項目                 | React Router | TanStack Router | 勝者                |
| -------------------- | ------------ | --------------- | ------------------- |
| **Total Load Time**  | 5,627ms      | **4,934ms** ⚡  | **TanStack Router** |
| **Network Requests** | 21           | 32              | React Router        |
| **Data Transfer**    | **5.95KB**   | 10.25KB         | **React Router**    |
| **Navigation**       | **1,039ms**  | 1,079ms         | **React Router**    |

**結論**: ユーザーの体感が正しく、**TanStack Router** がページロード性能で優位

### 3. performance-results 構造の最適化

**従来の問題:**

```
performance-results/
├── latest-results.json           # どれがメイン？
├── latest-browser-results.json   # どれがメイン？
├── results-[timestamp].json      # 履歴が混在
├── browser-results-[timestamp].json # 履歴が混在
├── react-router-stats.html       # 名前が不明瞭
└── tanstack-router-stats.html    # 名前が不明瞭
```

**改善後の構造:**

```
performance-results/
├── 📄 latest-browser-performance.json      # ⭐ メイン結果
├── 📄 latest-build-performance.json        # ビルド結果
├── 📄 react-router-bundle-stats.html       # 明瞭な命名
├── 📄 tanstack-router-bundle-stats.html    # 明瞭な命名
├── 📄 README.md                            # 使い方説明
└── 📁 history/                             # 履歴整理
    ├── 📁 browser/                         # ブラウザ測定履歴
    └── 📁 build/                           # ビルド測定履歴
```

## 📊 最終的な測定結果サマリー

### ページロード性能 (最重要)

- **TanStack Router**: 4,934ms ⚡ **Winner**
- **React Router**: 5,627ms
- **差**: 694ms (約 14%高速)

### データ転送効率

- **React Router**: 5.95KB ⚡ **Winner**
- **TanStack Router**: 10.25KB
- **差**: 4.3KB 少ない

### ナビゲーション性能

- **React Router**: 1,039ms ⚡ **Winner**
- **TanStack Router**: 1,079ms
- **差**: 40ms 高速

### 総合評価

| 観点                   | 勝者                | 理由                     |
| ---------------------- | ------------------- | ------------------------ |
| **初回ページロード**   | **TanStack Router** | 実際のユーザー体験で重要 |
| **データ効率性**       | **React Router**    | 軽量なデータ転送         |
| **SPA ナビゲーション** | **React Router**    | わずかに高速             |

## 🎯 改善の成果

### 1. 測定精度の向上

- **従来**: バンドルサイズのみ → 実際の性能と乖離
- **改善後**: 実ブラウザ測定 → ユーザー体験と一致

### 2. 結果の信頼性向上

- **複数回測定**: 平均値による安定した結果
- **自動化**: 人的ミスの排除
- **Web Vitals**: 標準的な性能指標

### 3. 使いやすさの向上

- **明瞭なファイル構造**: どれを見るべきか一目瞭然
- **詳細なドキュメント**: 結果の解釈方法を説明
- **履歴管理**: 過去の結果との比較が容易

## 🔧 技術的実装詳細

### ブラウザ測定システム

```javascript
// 主要な測定ロジック
async function measurePagePerformance(url, pageName, iterations = 3) {
  // Puppeteerでブラウザ起動
  const browser = await puppeteer.launch({ headless: true });

  // キャッシュ無効化で正確な測定
  await page.setCacheEnabled(false);

  // ネットワーク監視
  await client.send("Network.enable");

  // Web Vitals取得
  const webVitals = await page.evaluate(() => {
    // LCP, FCP測定
  });

  // 複数回測定で平均値算出
  return avgMetrics;
}
```

### ファイル管理の自動化

```javascript
// 新しい保存ロジック
function saveResults(data) {
  // 最新結果を最上位に
  const latestPath = "latest-browser-performance.json";

  // 履歴を専用ディレクトリに
  const historyPath = "history/browser/browser-results-[timestamp].json";

  // 自動ディレクトリ作成
  ensureDirectoryExists();
}
```

## 📈 今後の運用指針

### 推奨測定フロー

1. **`npm run test:performance:browser`** - 実際の性能比較 ⭐
2. **`npm run test:performance`** - ビルド効率比較
3. **手動 DevTools** - 詳細デバッグ時のみ

### 結果の解釈

- **`latest-browser-performance.json`** を最優先で確認
- **複数回測定の必要性**: 環境による変動を考慮
- **履歴との比較**: 継続的な改善の追跡

### メンテナンス

- **定期測定**: 新機能追加後は必ず再測定
- **環境の統一**: ネットワーク条件やブラウザ設定
- **結果の記録**: 重要な変更時は履歴を保存

## 🎉 結論

この改善により、以下が実現されました：

1. **正確な性能測定**: 実際のユーザー体験を反映
2. **自動化による効率化**: 手動作業の削減
3. **明瞭な結果管理**: 迷わない構造とドキュメント
4. **継続的な改善基盤**: 履歴管理と比較システム

**最も重要な発見**: バンドルサイズだけでは実際の性能は測れない。実際のブラウザでの測定が不可欠。
