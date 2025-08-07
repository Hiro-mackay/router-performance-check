#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const http = require("http");
const https = require("https");
const { URL } = require("url");

console.log(
  "🚀 Browser-based Router Performance Comparison Test (High-Load Version)\n"
);

// Configuration object for centralized settings management
const CONFIG = {
  apps: [
    {
      name: "React Router",
      url: "http://localhost:5173",
      navLinkSelector: 'a[href*="posts"]',
      pageUrl: "http://localhost:5173/posts",
      // ✅ 実際のページ構造に合わせたセレクタ（h1要素を待機）
      postsPageSelector: "h1",
    },
    {
      name: "TanStack Router",
      url: "http://localhost:3000",
      navLinkSelector: 'a[href*="posts"]',
      pageUrl: "http://localhost:3000/posts",
      // ✅ 実際のページ構造に合わせたセレクタ（h1要素を待機）
      postsPageSelector: "h1",
    },
  ],
  iterations: 3,
  timeouts: {
    serverCheck: 5000,
    pageLoad: 30000,
    navigation: 10000,
    webVitals: 15000,
  },
  retries: {
    serverCheck: 30,
    retryDelay: 1000,
  },
  puppeteerArgs: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    // ✅ --disable-web-securityを削除: 通常のユーザー環境に近い条件でテストするため
    // CORS問題がある場合は、サーバー側で適切なCORS設定を行うべき
    "--disable-features=VizDisplayCompositor",
  ],
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function waitForServer(
  url,
  maxRetries = CONFIG.retries.serverCheck,
  retryDelay = CONFIG.retries.retryDelay
) {
  log(`⏳ Waiting for server at ${url}...`, colors.yellow);

  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === "https:" ? https : http;

        const req = client.get(
          url,
          {
            timeout: CONFIG.timeouts.serverCheck,
          },
          (res) => {
            // サーバーが応答すれば成功とみなす（ステータスコードは問わない）
            resolve(res);
          }
        );

        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Request timeout"));
        });
      });

      log(`✅ Server at ${url} is ready`, colors.green);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Server at ${url} is not ready after ${maxRetries} retries`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

async function measurePagePerformance(
  url,
  pageName,
  iterations = CONFIG.iterations
) {
  log(`\n📊 Measuring performance for ${pageName} (${url})`, colors.blue);

  // Find app configuration for reliable selectors
  const appConfig = CONFIG.apps.find((app) => app.name === pageName);
  if (!appConfig) {
    log(`❌ No configuration found for app: ${pageName}`, colors.red);
    return null;
  }

  const results = [];

  // ブラウザを一度だけ起動
  const browser = await puppeteer.launch({
    headless: true,
    args: CONFIG.puppeteerArgs,
  });

  for (let i = 0; i < iterations; i++) {
    log(`  Run ${i + 1}/${iterations}...`, colors.cyan);

    const page = await browser.newPage();

    // Clear cache for fresh load
    await page.setCacheEnabled(false);

    // Enable network domain for request monitoring
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");
    await client.send("Performance.enable");

    // ✅ 各イテレーション開始時に測定変数をリセット
    let performanceMetrics = {};
    let networkRequests = [];
    let totalTransferSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    // Monitor network requests
    client.on("Network.responseReceived", (params) => {
      const response = params.response;
      networkRequests.push({
        url: response.url,
        status: response.status,
        mimeType: response.mimeType,
        encodedDataLength: response.encodedDataLength || 0,
      });

      totalTransferSize += response.encodedDataLength || 0;

      if (response.mimeType && response.mimeType.includes("javascript")) {
        jsSize += response.encodedDataLength || 0;
      } else if (response.mimeType && response.mimeType.includes("css")) {
        cssSize += response.encodedDataLength || 0;
      }
    });

    // Start performance measurement
    const startTime = Date.now();

    try {
      // Navigate to page with more stable waiting condition
      await page.goto(url, {
        waitUntil: "domcontentloaded", // まずDOMの準備完了を待つ
        timeout: CONFIG.timeouts.pageLoad,
      });

      // ✅ アプリケーションの主要コンテンツが表示されたことを確認する
      try {
        await page.waitForSelector(appConfig.postsPageSelector, {
          timeout: 10000,
          visible: true,
        });
      } catch (selectorError) {
        log(
          `⚠️ Posts page selector not found, continuing with basic waiting: ${selectorError.message}`,
          colors.yellow
        );
        // フォールバック: 少し待機してからcontinue
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // ✅ 簡単なフォールバック測定: 実際の経過時間
      const actualLoadTime = Date.now() - startTime;

      // Get performance metrics using more robust approach
      const performanceData = await page.evaluate(() => {
        const perfData = performance.getEntriesByType("navigation")[0];

        // より安全なフォールバック処理
        const safeValue = (value) => {
          return value && value > 0 ? value : 0;
        };

        const safeDuration = (end, start) => {
          if (!end || !start || end <= 0 || start <= 0) return 0;
          return end - start;
        };

        return {
          domContentLoaded: safeDuration(
            perfData.domContentLoadedEventEnd,
            perfData.domContentLoadedEventStart
          ),
          loadComplete: safeDuration(
            perfData.loadEventEnd,
            perfData.loadEventStart
          ),
          domInteractive: safeDuration(
            perfData.domInteractive,
            perfData.navigationStart
          ),
          totalLoadTime:
            safeValue(perfData.duration) ||
            safeDuration(perfData.loadEventEnd, perfData.navigationStart) ||
            safeDuration(
              perfData.domContentLoadedEventEnd,
              perfData.navigationStart
            ),
          actualLoadTime: 0, // Will be set from external measurement
          firstContentfulPaint: 0, // Will be updated below
          largestContentfulPaint: 0, // Will be updated below
        };
      });

      // Get Web Vitals metrics
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let lcp;
          let fcp;

          const resolveIfReady = () => {
            if (lcp !== undefined && fcp !== undefined) {
              resolve({
                largestContentfulPaint: lcp,
                firstContentfulPaint: fcp,
              });
            }
          };

          // FCP - First Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              fcp = entries[0].startTime;
              resolveIfReady();
            }
          }).observe({ type: "first-contentful-paint", buffered: true });

          // LCP - Largest Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              lcp = entries[entries.length - 1].startTime;
              resolveIfReady();
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });

          // タイムアウトを設定して、無限に待機するのを防ぐ
          setTimeout(() => {
            // ✅ タイムアウト時のログ出力を追加
            if (lcp === undefined || fcp === undefined) {
              console.warn(
                "Web Vitals (LCP/FCP) measurement timed out. LCP:",
                lcp,
                "FCP:",
                fcp
              );
            }
            // 片方しか取得できていなくても、タイムアウトしたら解決する
            resolve({
              largestContentfulPaint: lcp || 0,
              firstContentfulPaint: fcp || 0,
            });
          }, 15000); // ✅ CONFIG.timeouts.webVitalsの値を直接指定
        });
      });

      performanceMetrics = {
        ...performanceData,
        ...webVitals,
        // ✅ より信頼できる測定値を使用
        totalLoadTime: performanceData.totalLoadTime || actualLoadTime,
        actualLoadTime, // 実際の経過時間も保持
        networkRequests: networkRequests.length,
        totalTransferSize,
        jsSize,
        cssSize,
      };
    } catch (error) {
      log(`❌ Error measuring ${pageName}: ${error.message}`, colors.red);
      performanceMetrics = null;
    }

    await page.close(); // ページのみを閉じる

    if (performanceMetrics) {
      results.push(performanceMetrics);
      log(
        `    ✅ Run ${i + 1} completed: ${performanceMetrics.totalLoadTime}ms`,
        colors.green
      );
    }
  }

  // すべてのイテレーションが終了後にブラウザを閉じる
  await browser.close();

  if (results.length === 0) {
    return null;
  }

  // Calculate averages
  const avgMetrics = {
    domContentLoaded:
      results.reduce((sum, r) => sum + r.domContentLoaded, 0) / results.length,
    loadComplete:
      results.reduce((sum, r) => sum + r.loadComplete, 0) / results.length,
    domInteractive:
      results.reduce((sum, r) => sum + r.domInteractive, 0) / results.length,
    firstContentfulPaint:
      results.reduce((sum, r) => sum + (r.firstContentfulPaint || 0), 0) /
      results.length,
    largestContentfulPaint:
      results.reduce((sum, r) => sum + (r.largestContentfulPaint || 0), 0) /
      results.length,
    totalLoadTime:
      results.reduce((sum, r) => sum + r.totalLoadTime, 0) / results.length,
    networkRequests: Math.round(
      results.reduce((sum, r) => sum + r.networkRequests, 0) / results.length
    ),
    totalTransferSize: Math.round(
      results.reduce((sum, r) => sum + r.totalTransferSize, 0) / results.length
    ),
    jsSize: Math.round(
      results.reduce((sum, r) => sum + r.jsSize, 0) / results.length
    ),
    cssSize: Math.round(
      results.reduce((sum, r) => sum + r.cssSize, 0) / results.length
    ),
    iterations: results.length,
    rawResults: results,
  };

  return avgMetrics;
}

async function measureNavigationPerformance(url, pageName) {
  log(`\n🧭 Measuring navigation performance for ${pageName}`, colors.blue);

  // Find app configuration
  const appConfig = CONFIG.apps.find((app) => app.name === pageName);
  if (!appConfig) {
    log(`❌ No configuration found for app: ${pageName}`, colors.red);
    return null;
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Load the main page first
    await page.goto(url, { waitUntil: "networkidle0" });

    // ✅ クリックする前に要素の存在を確認
    await page.waitForSelector(appConfig.navLinkSelector, {
      visible: true,
      timeout: CONFIG.timeouts.navigation,
    });

    // Measure navigation to posts page
    const startTime = Date.now();

    // Click on posts link using CONFIG selector
    try {
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "networkidle0",
          timeout: CONFIG.timeouts.navigation,
        }),
        page.click(appConfig.navLinkSelector),
      ]);

      const navigationTime = Date.now() - startTime;

      await browser.close();
      return navigationTime;
    } catch (error) {
      log(
        `⚠️ Navigation test failed for ${pageName}: ${error.message}`,
        colors.yellow
      );
      await browser.close();
      return null;
    }
  } catch (error) {
    log(
      `❌ Navigation measurement failed for ${pageName}: ${error.message}`,
      colors.red
    );
    await browser.close();
    return null;
  }
}

function saveResults(data) {
  const resultsDir = path.join(__dirname, "performance-results");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save latest browser results
  const latestResultsPath = path.join(
    resultsDir,
    "latest-browser-performance.json"
  );
  fs.writeFileSync(latestResultsPath, JSON.stringify(data, null, 2));

  // Ensure history directories exist
  const historyDir = path.join(resultsDir, "history", "browser");
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Save timestamped results in history
  const timestampedResultsPath = path.join(
    historyDir,
    `browser-results-${timestamp}.json`
  );
  fs.writeFileSync(timestampedResultsPath, JSON.stringify(data, null, 2));

  log(`\n💾 Browser test results saved to:`, colors.blue);
  log(`  Latest: ${latestResultsPath}`);
  log(`  Timestamped: ${timestampedResultsPath}`);
}

function displayResults(
  reactRouterMetrics,
  tanstackRouterMetrics,
  reactRouterNav,
  tanstackRouterNav
) {
  log("\n📊 Browser Performance Comparison Results", colors.bright);
  log("=".repeat(60), colors.cyan);

  if (reactRouterMetrics && tanstackRouterMetrics) {
    log("\n⚡ Page Load Performance (average):", colors.yellow);

    log(`  React Router (localhost:5173/posts):`, colors.green);
    log(
      `    Total Load Time: ${Math.round(reactRouterMetrics.totalLoadTime)}ms`
    );
    log(
      `    DOM Content Loaded: ${Math.round(
        reactRouterMetrics.domContentLoaded
      )}ms`
    );
    log(
      `    DOM Interactive: ${Math.round(reactRouterMetrics.domInteractive)}ms`
    );
    log(
      `    First Contentful Paint: ${Math.round(
        reactRouterMetrics.firstContentfulPaint
      )}ms`
    );
    log(
      `    Largest Contentful Paint: ${Math.round(
        reactRouterMetrics.largestContentfulPaint
      )}ms`
    );
    log(`    Network Requests: ${reactRouterMetrics.networkRequests}`);
    log(
      `    Total Transfer: ${formatBytes(reactRouterMetrics.totalTransferSize)}`
    );
    log(`    JavaScript: ${formatBytes(reactRouterMetrics.jsSize)}`);
    log(`    CSS: ${formatBytes(reactRouterMetrics.cssSize)}`);

    log(`\n  TanStack Router (localhost:3000/posts):`, colors.green);
    log(
      `    Total Load Time: ${Math.round(
        tanstackRouterMetrics.totalLoadTime
      )}ms`
    );
    log(
      `    DOM Content Loaded: ${Math.round(
        tanstackRouterMetrics.domContentLoaded
      )}ms`
    );
    log(
      `    DOM Interactive: ${Math.round(
        tanstackRouterMetrics.domInteractive
      )}ms`
    );
    log(
      `    First Contentful Paint: ${Math.round(
        tanstackRouterMetrics.firstContentfulPaint
      )}ms`
    );
    log(
      `    Largest Contentful Paint: ${Math.round(
        tanstackRouterMetrics.largestContentfulPaint
      )}ms`
    );
    log(`    Network Requests: ${tanstackRouterMetrics.networkRequests}`);
    log(
      `    Total Transfer: ${formatBytes(
        tanstackRouterMetrics.totalTransferSize
      )}`
    );
    log(`    JavaScript: ${formatBytes(tanstackRouterMetrics.jsSize)}`);
    log(`    CSS: ${formatBytes(tanstackRouterMetrics.cssSize)}`);

    // Performance comparison
    log("\n🏆 Performance Winner Analysis:", colors.magenta);

    const loadTimeDiff =
      reactRouterMetrics.totalLoadTime - tanstackRouterMetrics.totalLoadTime;
    const loadTimeWinner =
      loadTimeDiff > 0 ? "TanStack Router" : "React Router";
    const loadTimeRatio =
      Math.max(
        reactRouterMetrics.totalLoadTime,
        tanstackRouterMetrics.totalLoadTime
      ) /
      Math.min(
        reactRouterMetrics.totalLoadTime,
        tanstackRouterMetrics.totalLoadTime
      );

    log(
      `  Total Load Time: ${loadTimeWinner} is ${loadTimeRatio.toFixed(
        2
      )}x faster`
    );
    log(`  Difference: ${Math.abs(Math.round(loadTimeDiff))}ms`);

    const lcpDiff =
      reactRouterMetrics.largestContentfulPaint -
      tanstackRouterMetrics.largestContentfulPaint;
    const lcpWinner = lcpDiff > 0 ? "TanStack Router" : "React Router";

    log(
      `  Largest Contentful Paint: ${lcpWinner} is better by ${Math.abs(
        Math.round(lcpDiff)
      )}ms`
    );

    const transferDiff =
      reactRouterMetrics.totalTransferSize -
      tanstackRouterMetrics.totalTransferSize;
    const transferWinner =
      transferDiff > 0 ? "TanStack Router" : "React Router";

    log(
      `  Data Transfer: ${transferWinner} transfers ${formatBytes(
        Math.abs(transferDiff)
      )} less`
    );
  }

  if (reactRouterNav !== null && tanstackRouterNav !== null) {
    log("\n🧭 Navigation Performance:", colors.yellow);
    log(`  React Router: ${reactRouterNav}ms`);
    log(`  TanStack Router: ${tanstackRouterNav}ms`);

    const navWinner =
      reactRouterNav < tanstackRouterNav ? "React Router" : "TanStack Router";
    const navRatio =
      Math.max(reactRouterNav, tanstackRouterNav) /
      Math.min(reactRouterNav, tanstackRouterNav);

    log(`  🏆 ${navWinner} is ${navRatio.toFixed(2)}x faster for navigation`);
  }

  log("\n📋 Summary:", colors.bright);
  log("This test measures real browser performance including:");
  log("- Actual page load times");
  log("- Network transfer sizes");
  log("- DOM rendering performance");
  log("- Web Vitals metrics (LCP, FCP)");
  log("- Client-side navigation speed");
}

async function runBrowserPerformanceTest() {
  log("🏁 Starting Browser Performance Comparison\n", colors.bright);

  const testStartTime = Date.now();

  try {
    // Check if servers are running in parallel
    log("🔍 Checking if development servers are running...", colors.blue);

    await Promise.all([
      waitForServer(CONFIG.apps[0].url),
      waitForServer(CONFIG.apps[1].url),
    ]);

    log("\n✅ Both servers are ready for testing\n", colors.green);

    // Measure page load performance in parallel
    const [reactRouterMetrics, tanstackRouterMetrics] = await Promise.all([
      measurePagePerformance(CONFIG.apps[0].pageUrl, CONFIG.apps[0].name),
      measurePagePerformance(CONFIG.apps[1].pageUrl, CONFIG.apps[1].name),
    ]);

    // Measure navigation performance in parallel
    const [reactRouterNav, tanstackRouterNav] = await Promise.all([
      measureNavigationPerformance(CONFIG.apps[0].url, CONFIG.apps[0].name),
      measureNavigationPerformance(CONFIG.apps[1].url, CONFIG.apps[1].name),
    ]);

    // Display results
    displayResults(
      reactRouterMetrics,
      tanstackRouterMetrics,
      reactRouterNav,
      tanstackRouterNav
    );

    // Save results
    const performanceData = {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - testStartTime,
      testType: "browser-based",
      reactRouter: {
        url: CONFIG.apps[0].pageUrl,
        pageLoad: reactRouterMetrics,
        navigation: reactRouterNav,
        testDescription:
          "High-load version with 9 API requests, 2MB+ data, and heavy processing",
      },
      tanstackRouter: {
        url: CONFIG.apps[1].pageUrl,
        pageLoad: tanstackRouterMetrics,
        navigation: tanstackRouterNav,
        testDescription:
          "High-load version with 9 API requests, 2MB+ data, and heavy processing",
      },
      comparison:
        reactRouterMetrics && tanstackRouterMetrics
          ? {
              loadTimeWinner:
                reactRouterMetrics.totalLoadTime <
                tanstackRouterMetrics.totalLoadTime
                  ? "React Router"
                  : "TanStack Router",
              loadTimeDifference: Math.abs(
                reactRouterMetrics.totalLoadTime -
                  tanstackRouterMetrics.totalLoadTime
              ),
              transferSizeWinner:
                reactRouterMetrics.totalTransferSize <
                tanstackRouterMetrics.totalTransferSize
                  ? "React Router"
                  : "TanStack Router",
              transferSizeDifference: Math.abs(
                reactRouterMetrics.totalTransferSize -
                  tanstackRouterMetrics.totalTransferSize
              ),
              navigationWinner:
                reactRouterNav && tanstackRouterNav
                  ? reactRouterNav < tanstackRouterNav
                    ? "React Router"
                    : "TanStack Router"
                  : null,
            }
          : null,
    };

    saveResults(performanceData);

    log("\n🎯 Real Browser Performance Testing Complete!", colors.bright);
    log(
      "This automated test provides accurate real-world performance metrics.",
      colors.cyan
    );
  } catch (error) {
    log(`❌ Browser performance test failed: ${error.message}`, colors.red);
    log("\n💡 Make sure both development servers are running:", colors.yellow);
    log("  npm run dev");
    log("Or start them individually:");
    log("  npm run dev:react-router");
    log("  npm run dev:tanstack-router");
    process.exit(1);
  }
}

// Run the test
runBrowserPerformanceTest();
