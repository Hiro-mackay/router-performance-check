#!/usr/bin/env node

/**
 * Router Performance Benchmark Script
 * Measures and compares performance between React Router and TanStack Router
 * Based on best practices from https://github.com/addyosmani/puppeteer-webperf
 */

import fs from "fs-extra";
import path from "path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer";
import yargs from "yargs";
import chalk from "chalk";
import http from "http";
import https from "https";
import { URL } from "url";
import { lighthouseConfig, chromeFlags } from "./lighthouse-config.js";
import { CONFIG as DEFAULT_CONFIG, validateConfig } from "./config.js";

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue("ℹ"), msg),
  success: (msg) => console.log(chalk.green("✓"), msg),
  error: (msg) => console.log(chalk.red("✗"), msg),
  warn: (msg) => console.log(chalk.yellow("⚠"), msg),
  header: (msg) =>
    console.log(
      chalk.bold.cyan(
        "\n" + "=".repeat(50) + "\n" + msg + "\n" + "=".repeat(50)
      )
    ),
};

// Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if server is running
async function checkServerHealth(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const response = await new Promise((resolve, reject) => {
        const req = client.get(url, (res) => {
          resolve(res);
        });
        req.on("error", reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });

      if (response.statusCode >= 200 && response.statusCode < 400) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
      console.log(`Attempt ${i + 1}: ${error.message}`);
    }
    await sleep(1000);
  }
  return false;
}

// Launch Chrome for Lighthouse
async function launchChrome() {
  return await chromeLauncher.launch({
    chromeFlags,
    logLevel: "error",
  });
}

// Run Lighthouse audit
async function runLighthouseAudit(url, chrome) {
  const options = {
    logLevel: "error",
    output: "json",
    onlyCategories: ["performance"],
    port: chrome.port,
    settings: lighthouseConfig.settings,
  };

  try {
    const runnerResult = await lighthouse(url, options, lighthouseConfig);

    if (!runnerResult || !runnerResult.lhr) {
      log.error(`Lighthouse audit returned no results for ${url}`);
      return null;
    }

    return runnerResult.lhr;
  } catch (error) {
    log.error(`Lighthouse audit failed for ${url}: ${error.message}`);
    return null;
  }
}

// Measure Web Vitals with Puppeteer
async function measureWebVitals(url, browser) {
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({ width: 1350, height: 940 });

    // Inject Web Vitals library
    await page.evaluateOnNewDocument(() => {
      window.webVitalsData = {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
      };
    });

    // Navigate to page
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for page to settle
    await sleep(2000);

    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let collected = 0;
        const targetVitals = 3; // FCP, LCP, CLS

        function checkComplete() {
          collected++;
          if (collected >= targetVitals) {
            resolve(vitals);
          }
        }

        // FCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.fcp = entries[0].startTime;
            checkComplete();
          }
        }).observe({ entryTypes: ["paint"] });

        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          checkComplete();
        }).observe({ entryTypes: ["largest-contentful-paint"] });

        // CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
          checkComplete();
        }).observe({ entryTypes: ["layout-shift"] });

        // Fallback timeout
        setTimeout(() => {
          resolve(vitals);
        }, 5000);
      });
    });

    return webVitals;
  } catch (error) {
    log.error(`Web Vitals measurement failed for ${url}: ${error.message}`);
    return null;
  } finally {
    await page.close();
  }
}

// Measure basic page performance timing
async function measurePagePerformance(url, browser) {
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1350, height: 940 });

    // Navigate and measure basic timing
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for the page to be fully loaded
    await page.waitForSelector("body", { timeout: 10000 });
    await sleep(1000);

    // Get performance timing
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstByte: timing.responseStart - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
      };
    });

    return {
      performanceTiming,
    };
  } catch (error) {
    log.error(
      `Page performance measurement failed for ${url}: ${error.message}`
    );
    return null;
  } finally {
    await page.close();
  }
}

// Run comprehensive performance test for a single URL
async function runPerformanceTest(
  url,
  appName,
  routeName,
  chrome,
  browser,
  runIndex
) {
  log.info(`Running test ${runIndex + 1} for ${appName}/${routeName}`);

  const results = {
    app: appName,
    route: routeName,
    url: url,
    timestamp: new Date().toISOString(),
    runIndex: runIndex,
  };

  try {
    // Run Lighthouse audit
    const lighthouseResult = await runLighthouseAudit(url, chrome);
    if (lighthouseResult) {
      const performanceCategory = lighthouseResult.categories?.performance;
      const audits = lighthouseResult.audits || {};

      results.lighthouse = {
        performance: (performanceCategory?.score || 0) * 100,
        metrics: {
          fcp: audits["first-contentful-paint"]?.numericValue,
          lcp: audits["largest-contentful-paint"]?.numericValue,
          cls: audits["cumulative-layout-shift"]?.numericValue,
          tbt: audits["total-blocking-time"]?.numericValue,
          si: audits["speed-index"]?.numericValue,
          tti: audits["interactive"]?.numericValue,
        },
        opportunities: {
          unusedJs:
            audits["unused-javascript"]?.details?.overallSavingsBytes || 0,
          unusedCss:
            audits["unused-css-rules"]?.details?.overallSavingsBytes || 0,
          unminifiedJs:
            audits["unminified-javascript"]?.details?.overallSavingsBytes || 0,
        },
      };
    }

    // Measure Web Vitals with Puppeteer
    const webVitals = await measureWebVitals(url, browser);
    if (webVitals) {
      results.webVitals = webVitals;
    }

    // Measure basic page performance
    const pagePerformance = await measurePagePerformance(url, browser);
    if (pagePerformance) {
      results.pagePerformance = pagePerformance;
    }

    log.success(`Completed test ${runIndex + 1} for ${appName}/${routeName}`);
    return results;
  } catch (error) {
    log.error(`Test failed for ${appName}/${routeName}: ${error.message}`);
    return { ...results, error: error.message };
  }
}

// Main benchmark function
async function runBenchmark(options) {
  // config は必須パラメータとして処理
  if (!options.config) {
    throw new Error("config parameter is required in options");
  }

  const config = options.config;

  // Validate configuration
  const validation = validateConfig(options);
  if (!validation.isValid) {
    log.error("Configuration validation failed:");
    validation.errors.forEach((error) => log.error(`  - ${error}`));
    throw new Error("Invalid configuration");
  }

  // CONFIGから直接値を取得
  const { apps, routes, runs } = config;

  log.header("Router Performance Benchmark");

  // Ensure output directory exists
  await fs.ensureDir(config.outputDir);

  const allResults = [];
  let chrome;
  let browser;

  try {
    // Launch Chrome and Puppeteer
    log.info("Launching Chrome for Lighthouse...");
    try {
      chrome = await launchChrome();
      log.success("Chrome launched successfully");
    } catch (error) {
      log.error(`Failed to launch Chrome: ${error.message}`);
      throw error;
    }

    log.info("Launching Puppeteer...");
    try {
      // Connect Puppeteer to the same Chrome instance
      browser = await puppeteer.connect({
        browserURL: `http://localhost:${chrome.port}`,
      });
      log.success("Puppeteer connected successfully");
    } catch (error) {
      log.error(`Failed to connect Puppeteer: ${error.message}`);
      // Fallback: launch separate Puppeteer instance
      try {
        log.info("Trying to launch separate Puppeteer instance...");
        browser = await puppeteer.launch({
          headless: "new",
          args: chromeFlags.filter(
            (flag) => !flag.includes("--remote-debugging-port")
          ),
        });
        log.success("Puppeteer launched separately");
      } catch (fallbackError) {
        log.error(
          `Failed to launch Puppeteer fallback: ${fallbackError.message}`
        );
        throw fallbackError;
      }
    }

    // Run tests for each app and route combination
    for (const app of apps) {
      log.header(`Testing ${app.name.toUpperCase()}`);

      // Check if server is running
      log.info(`Checking if ${app.name} server is running on ${app.url}...`);
      const isServerRunning = await checkServerHealth(app.url);

      if (!isServerRunning) {
        log.error(
          `Server for ${app.name} is not running on ${app.url}. Please start the development server.`
        );
        continue;
      }

      log.success(`Server for ${app.name} is running`);

      for (const route of routes) {
        const testUrl = `${app.url}${route.path}`;
        log.info(`Testing route: ${route.name} (${testUrl})`);

        // Warmup runs
        log.info("Running warmup...");
        for (let i = 0; i < config.warmupRuns; i++) {
          await runPerformanceTest(
            testUrl,
            app.name,
            route.name,
            chrome,
            browser,
            -1
          );
          await sleep(config.waitTime);
        }

        // Measurement runs
        log.info("Running measurements...");
        for (let i = 0; i < runs; i++) {
          const result = await runPerformanceTest(
            testUrl,
            app.name,
            route.name,
            chrome,
            browser,
            i
          );
          allResults.push(result);

          if (i < runs - 1) {
            await sleep(config.waitTime);
          }
        }
      }
    }

    // Save results (fixed filename to keep only latest)
    const resultsFile = path.join(config.outputDir, "benchmark-results.json");
    await fs.writeJson(
      resultsFile,
      {
        metadata: {
          timestamp: new Date().toISOString(),
          config,
          runs,
          lighthouseVersion: "11.4.0", // Fixed version
          puppeteerVersion: "21.11.0", // Fixed version
        },
        results: allResults,
      },
      { spaces: 2 }
    );

    log.success(`Results saved to: ${resultsFile}`);
    log.success(`Total tests completed: ${allResults.length}`);

    return resultsFile;
  } catch (error) {
    log.error(`Benchmark failed: ${error.message}`);
    throw error;
  } finally {
    // Cleanup
    if (chrome) {
      await chrome.kill();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// CLI interface
async function main() {
  const CONFIG = DEFAULT_CONFIG;

  const argv = yargs(process.argv.slice(2))
    .option("apps", {
      type: "array",
      description: "Apps to test (react-router, tanstack-router, next)",
      default: CONFIG.apps.map((app) => app.name),
    })
    .option("routes", {
      type: "array",
      description: "Routes to test",
      default: CONFIG.routes.map((route) => route.name),
    })
    .option("runs", {
      type: "number",
      description: "Number of measurement runs per test",
      default: CONFIG.runs,
    })
    .help()
    .parseSync();

  try {
    const selectedApps = CONFIG.apps.filter((app) =>
      argv.apps.includes(app.name)
    );
    const selectedRoutes = CONFIG.routes.filter((route) =>
      argv.routes.includes(route.name)
    );

    // コマンドライン引数に基づいてCONFIGを整形
    const customConfig = {
      ...CONFIG,
      apps: selectedApps,
      routes: selectedRoutes,
      runs: argv.runs,
    };

    const resultsFile = await runBenchmark({
      config: customConfig,
    });

    log.header("Benchmark Complete!");
    log.info(`Results file: ${resultsFile}`);
    log.info('Run "npm run perf:analyze" to analyze the results');
  } catch (error) {
    log.error(`Benchmark failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runBenchmark, DEFAULT_CONFIG };
