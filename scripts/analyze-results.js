#!/usr/bin/env node

/**
 * Performance Results Analysis Script
 * Analyzes and compares benchmark results between React Router and TanStack Router
 */

import fs from "fs-extra";
import path from "path";
import yargs from "yargs";
import chalk from "chalk";
import { table } from "table";

// Logging utilities
const log = {
  info: (msg) => console.log(chalk.blue("ℹ"), msg),
  success: (msg) => console.log(chalk.green("✓"), msg),
  error: (msg) => console.log(chalk.red("✗"), msg),
  warn: (msg) => console.log(chalk.yellow("⚠"), msg),
  header: (msg) =>
    console.log(
      chalk.bold.cyan(
        "\n" + "=".repeat(60) + "\n" + msg + "\n" + "=".repeat(60)
      )
    ),
  subheader: (msg) =>
    console.log(
      chalk.bold.yellow(
        "\n" + "-".repeat(40) + "\n" + msg + "\n" + "-".repeat(40)
      )
    ),
};

// Statistical functions
function calculateStats(values) {
  if (!values || values.length === 0) return null;

  const validValues = values.filter(
    (v) => v !== null && v !== undefined && !isNaN(v)
  );
  if (validValues.length === 0) return null;

  const sorted = [...validValues].sort((a, b) => a - b);
  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;

  // Calculate variance and standard deviation
  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    validValues.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: validValues.length,
    min: Math.min(...validValues),
    max: Math.max(...validValues),
    mean: mean,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    stdDev: stdDev,
    coefficientOfVariation: stdDev / mean,
  };
}

function formatNumber(num, decimals = 2, unit = "") {
  if (num === null || num === undefined || isNaN(num)) return "N/A";
  return `${num.toFixed(decimals)}${unit}`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getPerformanceGrade(value, metric) {
  const thresholds = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    tbt: { good: 200, poor: 600 },
    tti: { good: 3800, poor: 7300 },
    si: { good: 3400, poor: 5800 },
  };

  const threshold = thresholds[metric];
  if (!threshold || value === null || value === undefined) return "?";

  if (metric === "cls") {
    if (value <= threshold.good) return chalk.green("Good");
    if (value <= threshold.poor) return chalk.yellow("Needs Improvement");
    return chalk.red("Poor");
  } else {
    if (value <= threshold.good) return chalk.green("Good");
    if (value <= threshold.poor) return chalk.yellow("Needs Improvement");
    return chalk.red("Poor");
  }
}

function calculateImprovement(baseline, comparison, reverse = false) {
  if (!baseline || !comparison || baseline === 0) return null;

  const improvement = reverse
    ? ((baseline - comparison) / baseline) * 100
    : ((comparison - baseline) / baseline) * 100;

  return improvement;
}

function formatImprovement(improvement, reverse = false) {
  if (improvement === null || improvement === undefined) return "N/A";

  const sign = improvement > 0 ? "+" : "";
  const color = (reverse ? improvement < 0 : improvement > 0)
    ? chalk.green
    : chalk.red;

  return color(`${sign}${improvement.toFixed(1)}%`);
}

// Load and parse results
async function loadResults(filePath) {
  try {
    const data = await fs.readJson(filePath);
    return data;
  } catch (error) {
    throw new Error(
      `Failed to load results from ${filePath}: ${error.message}`
    );
  }
}

// Find the latest results file
async function findLatestResults(outputDir = "./reports") {
  try {
    const resultsFile = path.join(outputDir, "benchmark-results.json");
    const exists = await fs.pathExists(resultsFile);
    return exists ? resultsFile : null;
  } catch (error) {
    return null;
  }
}

// Group results by app and route
function groupResults(results) {
  const grouped = {};

  for (const result of results) {
    const key = `${result.app}-${result.route}`;
    if (!grouped[key]) {
      grouped[key] = {
        app: result.app,
        route: result.route,
        runs: [],
      };
    }
    grouped[key].runs.push(result);
  }

  return grouped;
}

// Analyze grouped results
function analyzeGroupedResults(grouped) {
  const analysis = {};

  for (const [key, group] of Object.entries(grouped)) {
    const runs = group.runs.filter((run) => !run.error);

    if (runs.length === 0) {
      analysis[key] = { ...group, error: "No successful runs" };
      continue;
    }

    // Extract Lighthouse metrics
    const lighthouseMetrics = {};
    const lighthouseFields = ["fcp", "lcp", "cls", "tbt", "tti", "si"];

    for (const field of lighthouseFields) {
      const values = runs
        .map((run) => run.lighthouse?.metrics?.[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      lighthouseMetrics[field] = calculateStats(values);
    }

    // Extract performance scores
    const performanceScores = runs
      .map((run) => run.lighthouse?.performance)
      .filter((v) => v !== null && v !== undefined && !isNaN(v));

    // Extract Web Vitals
    const webVitals = {};
    const webVitalsFields = ["fcp", "lcp", "cls"];

    for (const field of webVitalsFields) {
      const values = runs
        .map((run) => run.webVitals?.[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      webVitals[field] = calculateStats(values);
    }

    // Extract page performance timing
    const pagePerformanceTiming = {};
    const timingFields = [
      "domContentLoaded",
      "loadComplete",
      "firstByte",
      "domInteractive",
    ];

    for (const field of timingFields) {
      const values = runs
        .map((run) => run.pagePerformance?.performanceTiming?.[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      pagePerformanceTiming[field] = calculateStats(values);
    }

    // Extract bundle optimization opportunities
    const bundleOptimization = {};
    const bundleFields = ["unusedJs", "unusedCss", "unminifiedJs"];

    for (const field of bundleFields) {
      const values = runs
        .map((run) => run.lighthouse?.opportunities?.[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      bundleOptimization[field] = calculateStats(values);
    }

    analysis[key] = {
      ...group,
      runs: runs.length,
      lighthouse: {
        performanceScore: calculateStats(performanceScores),
        metrics: lighthouseMetrics,
        opportunities: bundleOptimization,
      },
      webVitals,
      pagePerformance: pagePerformanceTiming,
    };
  }

  return analysis;
}

// Generate comparison between apps
function generateComparison(analysis) {
  const comparison = {};
  const routes = [...new Set(Object.values(analysis).map((a) => a.route))];

  for (const route of routes) {
    const reactRouter = analysis[`react-router-${route}`];
    const tanstackRouter = analysis[`tanstack-router-${route}`];

    if (!reactRouter || !tanstackRouter) continue;

    comparison[route] = {
      route,
      reactRouter,
      tanstackRouter,
      improvements: {},
    };

    // Calculate improvements (negative means TanStack is better)
    const metrics = ["fcp", "lcp", "cls", "tbt", "tti", "si"];

    for (const metric of metrics) {
      const reactValue = reactRouter.lighthouse?.metrics?.[metric]?.mean;
      const tanstackValue = tanstackRouter.lighthouse?.metrics?.[metric]?.mean;

      if (reactValue && tanstackValue) {
        comparison[route].improvements[metric] = calculateImprovement(
          reactValue,
          tanstackValue,
          metric === "cls" // CLS: lower is better
        );
      }
    }

    // Performance score improvement
    const reactScore = reactRouter.lighthouse?.performanceScore?.mean;
    const tanstackScore = tanstackRouter.lighthouse?.performanceScore?.mean;

    if (reactScore && tanstackScore) {
      comparison[route].improvements.performanceScore = calculateImprovement(
        reactScore,
        tanstackScore
      );
    }
  }

  return comparison;
}

// Display analysis results
function displayAnalysis(analysis, comparison) {
  log.header("PERFORMANCE ANALYSIS RESULTS");

  // Individual app analysis
  for (const [key, result] of Object.entries(analysis)) {
    if (result.error) {
      log.error(`${result.app} (${result.route}): ${result.error}`);
      continue;
    }

    log.subheader(
      `${result.app.toUpperCase()} - ${result.route} Route (${
        result.runs
      } runs)`
    );

    // Performance Score
    if (result.lighthouse?.performanceScore) {
      const score = result.lighthouse.performanceScore;
      console.log(`\n${chalk.bold("Lighthouse Performance Score:")}`);
      console.log(`  Mean: ${formatNumber(score.mean, 1)}/100`);
      console.log(
        `  Range: ${formatNumber(score.min, 1)} - ${formatNumber(score.max, 1)}`
      );
      console.log(`  Std Dev: ${formatNumber(score.stdDev, 2)}`);
    }

    // Core Web Vitals
    console.log(`\n${chalk.bold("Core Web Vitals (Lighthouse):")}`);
    const metrics = [
      { key: "fcp", name: "First Contentful Paint", unit: "ms" },
      { key: "lcp", name: "Largest Contentful Paint", unit: "ms" },
      { key: "cls", name: "Cumulative Layout Shift", unit: "" },
      { key: "tbt", name: "Total Blocking Time", unit: "ms" },
      { key: "tti", name: "Time to Interactive", unit: "ms" },
      { key: "si", name: "Speed Index", unit: "ms" },
    ];

    for (const metric of metrics) {
      const data = result.lighthouse?.metrics?.[metric.key];
      if (data) {
        const grade = getPerformanceGrade(data.mean, metric.key);
        console.log(
          `  ${metric.name}: ${formatNumber(
            data.mean,
            0,
            metric.unit
          )} (${grade})`
        );
      }
    }

    // Bundle optimization opportunities
    if (result.lighthouse?.opportunities) {
      console.log(`\n${chalk.bold("Bundle Optimization Opportunities:")}`);
      const opp = result.lighthouse.opportunities;

      if (opp.unusedJs?.mean > 0) {
        console.log(`  Unused JavaScript: ${formatBytes(opp.unusedJs.mean)}`);
      }
      if (opp.unusedCss?.mean > 0) {
        console.log(`  Unused CSS: ${formatBytes(opp.unusedCss.mean)}`);
      }
      if (opp.unminifiedJs?.mean > 0) {
        console.log(
          `  Unminified JavaScript: ${formatBytes(opp.unminifiedJs.mean)}`
        );
      }
    }

    // Page Performance timing
    if (result.pagePerformance) {
      console.log(`\n${chalk.bold("Page Performance Timing:")}`);
      const perf = result.pagePerformance;

      if (perf.domContentLoaded?.mean) {
        console.log(
          `  DOM Content Loaded: ${formatNumber(
            perf.domContentLoaded.mean,
            0,
            "ms"
          )}`
        );
      }
      if (perf.loadComplete?.mean) {
        console.log(
          `  Load Complete: ${formatNumber(perf.loadComplete.mean, 0, "ms")}`
        );
      }
      if (perf.firstByte?.mean) {
        console.log(
          `  Time to First Byte: ${formatNumber(perf.firstByte.mean, 0, "ms")}`
        );
      }
    }

    console.log("");
  }

  // Comparison between apps
  if (Object.keys(comparison).length > 0) {
    log.header("ROUTER COMPARISON");

    for (const [route, comp] of Object.entries(comparison)) {
      log.subheader(`${route.toUpperCase()} Route Comparison`);

      // Create comparison table
      const tableData = [
        ["Metric", "React Router", "TanStack Router", "Improvement"],
      ];

      // Performance Score
      if (comp.improvements.performanceScore !== undefined) {
        tableData.push([
          "Performance Score",
          formatNumber(comp.reactRouter.lighthouse?.performanceScore?.mean, 1) +
            "/100",
          formatNumber(
            comp.tanstackRouter.lighthouse?.performanceScore?.mean,
            1
          ) + "/100",
          formatImprovement(comp.improvements.performanceScore),
        ]);
      }

      // Core metrics
      const metricsToShow = [
        { key: "fcp", name: "First Contentful Paint (ms)", reverse: true },
        { key: "lcp", name: "Largest Contentful Paint (ms)", reverse: true },
        { key: "cls", name: "Cumulative Layout Shift", reverse: true },
        { key: "tbt", name: "Total Blocking Time (ms)", reverse: true },
        { key: "tti", name: "Time to Interactive (ms)", reverse: true },
      ];

      for (const metric of metricsToShow) {
        const reactValue =
          comp.reactRouter.lighthouse?.metrics?.[metric.key]?.mean;
        const tanstackValue =
          comp.tanstackRouter.lighthouse?.metrics?.[metric.key]?.mean;
        const improvement = comp.improvements[metric.key];

        if (reactValue !== undefined && tanstackValue !== undefined) {
          tableData.push([
            metric.name,
            formatNumber(reactValue, metric.key === "cls" ? 3 : 0),
            formatNumber(tanstackValue, metric.key === "cls" ? 3 : 0),
            formatImprovement(improvement, metric.reverse),
          ]);
        }
      }

      const tableConfig = {
        header: {
          alignment: "center",
          content: `${route.toUpperCase()} Route Performance Comparison`,
        },
        columns: [
          { alignment: "left", width: 30 },
          { alignment: "center", width: 15 },
          { alignment: "center", width: 15 },
          { alignment: "center", width: 15 },
        ],
      };

      console.log(table(tableData, tableConfig));
    }

    // Overall summary
    log.subheader("SUMMARY");

    let tanstackWins = 0;
    let reactWins = 0;
    let totalComparisons = 0;

    for (const comp of Object.values(comparison)) {
      for (const [metric, improvement] of Object.entries(comp.improvements)) {
        if (improvement !== null && improvement !== undefined) {
          totalComparisons++;
          if (improvement > 0) {
            tanstackWins++;
          } else {
            reactWins++;
          }
        }
      }
    }

    console.log(`Total metric comparisons: ${totalComparisons}`);
    console.log(
      `${chalk.green("TanStack Router wins:")} ${tanstackWins} (${(
        (tanstackWins / totalComparisons) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `${chalk.blue("React Router wins:")} ${reactWins} (${(
        (reactWins / totalComparisons) *
        100
      ).toFixed(1)}%)`
    );

    if (tanstackWins > reactWins) {
      console.log(
        `\n${chalk.green.bold(
          "🏆 TanStack Router shows better performance overall"
        )}`
      );
    } else if (reactWins > tanstackWins) {
      console.log(
        `\n${chalk.blue.bold(
          "🏆 React Router shows better performance overall"
        )}`
      );
    } else {
      console.log(
        `\n${chalk.yellow.bold(
          "🤝 Performance is comparable between both routers"
        )}`
      );
    }
  }
}

// Main analysis function
async function analyzeResults(filePath) {
  try {
    log.info(`Loading results from: ${filePath}`);
    const data = await loadResults(filePath);

    if (!data.results || data.results.length === 0) {
      throw new Error("No results found in the file");
    }

    log.info(`Found ${data.results.length} test results`);
    log.info(
      `Lighthouse version: ${data.metadata?.lighthouseVersion || "Unknown"}`
    );
    log.info(
      `Puppeteer version: ${data.metadata?.puppeteerVersion || "Unknown"}`
    );

    // Group and analyze results
    const grouped = groupResults(data.results);
    const analysis = analyzeGroupedResults(grouped);
    const comparison = generateComparison(analysis);

    // Display results
    displayAnalysis(analysis, comparison);

    // Save analysis (fixed filename to keep only latest)
    const analysisFile = path.join(
      path.dirname(filePath),
      "benchmark-analysis.json"
    );
    await fs.writeJson(
      analysisFile,
      {
        metadata: data.metadata,
        analysis,
        comparison,
        timestamp: new Date().toISOString(),
      },
      { spaces: 2 }
    );

    log.success(`Analysis saved to: ${analysisFile}`);
    return analysisFile;
  } catch (error) {
    log.error(`Analysis failed: ${error.message}`);
    throw error;
  }
}

// CLI interface
async function main() {
  const argv = yargs(process.argv.slice(2))
    .option("file", {
      type: "string",
      description: "Path to benchmark results file",
    })
    .help()
    .parseSync();

  try {
    let filePath = argv.file;

    if (!filePath) {
      log.info("No file specified, looking for latest results...");
      filePath = await findLatestResults();

      if (!filePath) {
        throw new Error(
          'No benchmark results found. Run "npm run perf:measure" first.'
        );
      }

      log.info(`Using latest results: ${filePath}`);
    }

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }

    await analyzeResults(filePath);
  } catch (error) {
    log.error(`Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeResults, loadResults, findLatestResults };
