#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Browser-based Router Performance Comparison Test\n");

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

async function waitForServer(url, maxRetries = 30, retryDelay = 1000) {
  log(`⏳ Waiting for server at ${url}...`, colors.yellow);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 5000 });
        await browser.close();
        log(`✅ Server at ${url} is ready`, colors.green);
        return true;
      } catch (error) {
        await browser.close();
        if (i === maxRetries - 1) {
          throw new Error(
            `Server at ${url} is not ready after ${maxRetries} retries`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

async function measurePagePerformance(url, pageName, iterations = 3) {
  log(`\n📊 Measuring performance for ${pageName} (${url})`, colors.blue);

  const results = [];

  for (let i = 0; i < iterations; i++) {
    log(`  Run ${i + 1}/${iterations}...`, colors.cyan);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    const page = await browser.newPage();

    // Clear cache for fresh load
    await page.setCacheEnabled(false);

    // Enable network domain for request monitoring
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");
    await client.send("Performance.enable");

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
      // Navigate to page
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for content to be loaded
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get performance metrics
      const performanceData = await page.evaluate(() => {
        const perfData = performance.getEntriesByType("navigation")[0];
        return {
          domContentLoaded:
            perfData.domContentLoadedEventEnd -
            perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          domInteractive: perfData.domInteractive - perfData.navigationStart,
          firstContentfulPaint: 0, // Will be updated below
          largestContentfulPaint: 0, // Will be updated below
        };
      });

      // Get Web Vitals metrics
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};

          // LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.largestContentfulPaint =
                entries[entries.length - 1].startTime;
            }
          }).observe({ entryTypes: ["largest-contentful-paint"] });

          // FCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.firstContentfulPaint = entries[0].startTime;
            }
          }).observe({ entryTypes: ["paint"] });

          // Wait a bit for metrics to be collected
          setTimeout(() => {
            resolve(vitals);
          }, 2000);
        });
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      performanceMetrics = {
        ...performanceData,
        ...webVitals,
        totalLoadTime: totalTime,
        networkRequests: networkRequests.length,
        totalTransferSize,
        jsSize,
        cssSize,
      };
    } catch (error) {
      log(`❌ Error measuring ${pageName}: ${error.message}`, colors.red);
      performanceMetrics = null;
    }

    await browser.close();

    if (performanceMetrics) {
      results.push(performanceMetrics);
      log(
        `    ✅ Run ${i + 1} completed: ${performanceMetrics.totalLoadTime}ms`,
        colors.green
      );
    }
  }

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

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Load the main page first
    await page.goto(url, { waitUntil: "networkidle0" });

    // Measure navigation to posts page
    const startTime = Date.now();

    // Click on posts link (assuming it exists)
    try {
      await page.click('a[href*="posts"]');
      await page.waitForSelector("body", { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for data loading

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
    "latest-browser-results.json"
  );
  fs.writeFileSync(latestResultsPath, JSON.stringify(data, null, 2));

  // Save timestamped results
  const timestampedResultsPath = path.join(
    resultsDir,
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
    // Check if servers are running
    log("🔍 Checking if development servers are running...", colors.blue);

    await waitForServer("http://localhost:5173");
    await waitForServer("http://localhost:3000");

    log("\n✅ Both servers are ready for testing\n", colors.green);

    // Measure page load performance
    const reactRouterMetrics = await measurePagePerformance(
      "http://localhost:5173/posts",
      "React Router"
    );

    const tanstackRouterMetrics = await measurePagePerformance(
      "http://localhost:3000/posts",
      "TanStack Router"
    );

    // Measure navigation performance
    const reactRouterNav = await measureNavigationPerformance(
      "http://localhost:5173",
      "React Router"
    );

    const tanstackRouterNav = await measureNavigationPerformance(
      "http://localhost:3000",
      "TanStack Router"
    );

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
        url: "http://localhost:5173/posts",
        pageLoad: reactRouterMetrics,
        navigation: reactRouterNav,
      },
      tanstackRouter: {
        url: "http://localhost:3000/posts",
        pageLoad: tanstackRouterMetrics,
        navigation: tanstackRouterNav,
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
