#!/usr/bin/env node

/**
 * Cloudflare Worker Performance Benchmark Script
 * Measures performance of deployed applications on Cloudflare Workers
 */

import fs from "fs-extra";
import path from "path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer";
import chalk from "chalk";
import { lighthouseConfig, chromeFlags } from "./lighthouse-config.js";

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cloudflare Worker URLs configuration
const CLOUDFLARE_CONFIG = {
  routes: [
    {
      name: "posts",
      path: "/posts",
      description: "Posts list page",
    },
  ],
  apps: [
    {
      name: "react-router",
      url: "https://react-router.johnmackay150.workers.dev",
      description: "React Router on Cloudflare Workers",
    },
    {
      name: "tanstack-router",
      url: "https://tanstack-router.johnmackay150.workers.dev",
      description: "TanStack Router on Cloudflare Workers",
    },
    {
      name: "next",
      url: "https://next.johnmackay150.workers.dev",
      description: "Next.js on Cloudflare Workers",
    },
  ],
  warmupRuns: 1,
  runs: 3,
  waitTime: 3000,
  outputDir: "./reports/cloudflare",
  // Cloudflare-specific settings
  cloudflare: {
    // Simulate different geographic locations
    locations: [{ name: "japan", cfRay: "japan" }],
    // Network conditions for Cloudflare edge
    networkConditions: {
      rttMs: 100, // Higher RTT for edge locations
      throughputKbps: 5 * 1024, // 5 Mbps for more realistic conditions
      cpuSlowdownMultiplier: 1.5, // Slightly slower CPU
    },
  },
};

// Launch Chrome for Lighthouse
async function launchChrome(userDataDir = null, portOffset = 0) {
  const port = 9222 + portOffset;

  const chromeFlags = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--remote-debugging-port=" + port,
    "--disable-web-security",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--no-first-run",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--disable-background-networking",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-default-browser-check",
    "--mute-audio",
    "--no-pings",
    "--password-store=basic",
    "--use-mock-keychain",
    "--disable-device-discovery-notifications",
  ];

  if (userDataDir) {
    chromeFlags.push(`--user-data-dir=${userDataDir}`);
  }

  try {
    const chrome = await chromeLauncher.launch({
      chromeFlags,
      port,
    });
    return chrome;
  } catch (error) {
    throw new Error(`Failed to launch Chrome: ${error.message}`);
  }
}

// Run Lighthouse audit with Cloudflare-specific settings
async function runLighthouseAudit(url, chrome, location = null) {
  try {
    const options = {
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance"],
      port: chrome.port,
      settings: {
        ...lighthouseConfig.settings,
        // Use Cloudflare-specific throttling
        throttling: CLOUDFLARE_CONFIG.cloudflare.networkConditions,
        // Add Cloudflare-specific headers if needed
        extraHeaders: location
          ? {
              "CF-Ray": location.cfRay,
              "CF-IPCountry": "JP",
            }
          : undefined,
      },
    };

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

    await sleep(2000);

    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let collected = 0;
        const targetVitals = 3;

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

// Measure page performance
async function measurePagePerformance(url, browser) {
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1350, height: 940 });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForSelector("body", { timeout: 10000 });
    await sleep(1000);

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

// Run performance test for a single URL
async function runPerformanceTest(
  url,
  appName,
  routeName,
  chrome,
  browser,
  runIndex,
  location = null
) {
  log.info(
    `Running test ${runIndex + 1} for ${appName}/${routeName}${
      location ? ` (${location.name})` : ""
    }`
  );

  const results = {
    app: appName,
    route: routeName,
    url: url,
    timestamp: new Date().toISOString(),
    runIndex: runIndex,
    location: location?.name || "default",
  };

  try {
    // Run Lighthouse audit
    const lighthouseResult = await runLighthouseAudit(url, chrome, location);
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

    // Measure Web Vitals
    const webVitals = await measureWebVitals(url, browser);
    if (webVitals) {
      results.webVitals = webVitals;
    }

    // Measure page performance
    const pagePerformance = await measurePagePerformance(url, browser);
    if (pagePerformance) {
      results.pagePerformance = pagePerformance;
    }

    log.success(`Completed test ${runIndex + 1} for ${appName}/${routeName}`);
    return results;
  } catch (error) {
    log.error(`Test failed for ${appName}/${routeName}: ${error.message}`);
    return results;
  }
}

// Main benchmark function
async function runCloudflareBenchmark() {
  log.header("Cloudflare Worker Performance Benchmark");

  await fs.ensureDir(CLOUDFLARE_CONFIG.outputDir);

  const allResults = [];
  let chrome;
  let browser;

  try {
    // Launch Chrome and Puppeteer
    log.info("Launching Chrome for Lighthouse...");
    chrome = await launchChrome();
    log.success("Chrome launched successfully");

    log.info("Launching Puppeteer...");
    browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`,
    });
    log.success("Puppeteer connected successfully");

    // Test each app
    for (const app of CLOUDFLARE_CONFIG.apps) {
      log.header(`Testing ${app.name.toUpperCase()} on Cloudflare Workers`);

      for (const route of CLOUDFLARE_CONFIG.routes) {
        const testUrl = `${app.url}${route.path}`;
        log.info(`Testing route: ${route.name} (${testUrl})`);

        // Test from different locations
        for (const location of CLOUDFLARE_CONFIG.cloudflare.locations) {
          log.info(`Testing from ${location.name}...`);

          // Warmup runs
          for (let i = 0; i < CLOUDFLARE_CONFIG.warmupRuns; i++) {
            await runPerformanceTest(
              testUrl,
              app.name,
              route.name,
              chrome,
              browser,
              -1,
              location
            );
            await sleep(CLOUDFLARE_CONFIG.waitTime);
          }

          // Measurement runs
          for (let i = 0; i < CLOUDFLARE_CONFIG.runs; i++) {
            const result = await runPerformanceTest(
              testUrl,
              app.name,
              route.name,
              chrome,
              browser,
              i,
              location
            );
            allResults.push(result);

            if (i < CLOUDFLARE_CONFIG.runs - 1) {
              await sleep(CLOUDFLARE_CONFIG.waitTime);
            }
          }
        }
      }
    }

    // Save results
    const resultsFile = path.join(
      CLOUDFLARE_CONFIG.outputDir,
      "cloudflare-benchmark-results.json"
    );
    await fs.writeJson(
      resultsFile,
      {
        metadata: {
          timestamp: new Date().toISOString(),
          config: CLOUDFLARE_CONFIG,
          runs: CLOUDFLARE_CONFIG.runs,
          lighthouseVersion: "11.4.0",
          puppeteerVersion: "21.11.0",
          environment: "cloudflare-workers",
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
    if (chrome) {
      await chrome.kill();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCloudflareBenchmark().catch((error) => {
    log.error(`Cloudflare benchmark failed: ${error.message}`);
    process.exit(1);
  });
}

export { runCloudflareBenchmark };
