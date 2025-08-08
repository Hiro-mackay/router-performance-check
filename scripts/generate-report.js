#!/usr/bin/env node

/**
 * HTML Report Generator for Router Performance Benchmarks
 * Generates comprehensive HTML reports with charts and visualizations
 */

import fs from "fs-extra";
import path from "path";
import yargs from "yargs";
import chalk from "chalk";
import { findLatestResults, loadResults } from "./analyze-results.js";

// Logging utilities
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

// Generate HTML report template
function generateHTMLReport(data, analysis, comparison) {
  const timestamp = new Date().toISOString();
  const metadata = data.metadata || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Router Performance Benchmark Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .metadata {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metadata h3 {
            color: #4a5568;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .metadata-item {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #2d3748;
        }
        
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-header {
            background: #4a5568;
            color: white;
            padding: 20px;
            font-size: 1.4em;
            font-weight: 600;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin-bottom: 20px;
        }
        
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .metric-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #2d3748;
        }
        
        .metric-value {
            font-size: 1.2em;
            margin-bottom: 5px;
        }
        
        .metric-improvement {
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .improvement-positive {
            color: #38a169;
        }
        
        .improvement-negative {
            color: #e53e3e;
        }
        
        .grade-good {
            color: #38a169;
            font-weight: 600;
        }
        
        .grade-needs-improvement {
            color: #d69e2e;
            font-weight: 600;
        }
        
        .grade-poor {
            color: #e53e3e;
            font-weight: 600;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .summary-title {
            font-size: 1.5em;
            margin-bottom: 15px;
        }
        
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .summary-stat {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 6px;
        }
        
        .summary-stat-value {
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .raw-data {
            max-height: 400px;
            overflow-y: auto;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        
        .tabs {
            display: flex;
            background: #e2e8f0;
            border-radius: 8px 8px 0 0;
            overflow: hidden;
        }
        
        .tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            background: #e2e8f0;
            border: none;
            font-size: 1em;
            font-weight: 600;
            color: #4a5568;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background: white;
            color: #2d3748;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .metadata-grid {
                grid-template-columns: 1fr;
            }
            
            .comparison-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #718096;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Router Performance Benchmark</h1>
            <div class="subtitle">React Router vs TanStack Router Performance Comparison</div>
            <div style="margin-top: 15px; font-size: 0.9em;">
                Generated on ${new Date(timestamp).toLocaleString()}
            </div>
        </div>

        <div class="metadata">
            <h3>📊 Test Configuration</h3>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <div class="metadata-label">Test Runs</div>
                    <div>${metadata.runs || "N/A"}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Lighthouse Version</div>
                    <div>${metadata.lighthouseVersion || "N/A"}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Puppeteer Version</div>
                    <div>${metadata.puppeteerVersion || "N/A"}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Tests</div>
                    <div>${data.results?.length || 0}</div>
                </div>
            </div>
        </div>

        ${generateDetailedResultsSection(analysis)}
        
        ${generateChartsSection(data.results, comparison)}
        
        ${generateRawDataSection(data)}
    </div>

    <div class="footer">
        Generated by Router Performance Benchmark Suite | 
        <a href="https://github.com/addyosmani/puppeteer-webperf" target="_blank">Powered by Puppeteer & Lighthouse</a>
    </div>

    <script>
        ${generateJavaScript(data.results, comparison)}
    </script>
</body>
</html>`;
}

// Generate summary section
function generateSummarySection(comparison) {
  if (!comparison || Object.keys(comparison).length === 0) {
    return '<div class="section"><div class="section-header">📈 Summary</div><div class="section-content">No comparison data available.</div></div>';
  }

  let tanstackWins = 0;
  let reactWins = 0;
  let totalComparisons = 0;
  let avgImprovement = 0;

  for (const comp of Object.values(comparison)) {
    for (const [metric, improvement] of Object.entries(comp.improvements)) {
      if (improvement !== null && improvement !== undefined) {
        totalComparisons++;
        avgImprovement += Math.abs(improvement);

        // For metrics where lower is better (fcp, lcp, tbt, tti, si), negative improvement means TanStack is better
        // For metrics where higher is better (performanceScore), positive improvement means TanStack is better
        const isLowerBetter = [
          "fcp",
          "lcp",
          "tbt",
          "tti",
          "si",
          "cls",
        ].includes(metric);

        if (isLowerBetter) {
          // Negative improvement means TanStack Router is better (faster/lower)
          if (improvement < 0) {
            tanstackWins++;
          } else {
            reactWins++;
          }
        } else {
          // Positive improvement means TanStack Router is better (higher score)
          if (improvement > 0) {
            tanstackWins++;
          } else {
            reactWins++;
          }
        }
      }
    }
  }

  avgImprovement = avgImprovement / totalComparisons;
  const winner =
    tanstackWins > reactWins
      ? "TanStack Router"
      : reactWins > tanstackWins
      ? "React Router"
      : "Tie";

  return `
    <div class="section">
        <div class="section-header">📈 Performance Summary</div>
        <div class="section-content">
            <div class="summary-box">
                <div class="summary-title">🏆 Overall Winner: ${winner}</div>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="summary-stat-value">${tanstackWins}</div>
                        <div>TanStack Wins</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${reactWins}</div>
                        <div>React Router Wins</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${totalComparisons}</div>
                        <div>Total Comparisons</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-value">${avgImprovement.toFixed(
                          1
                        )}%</div>
                        <div>Avg Performance Difference</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// Generate comparison section
function generateComparisonSection(comparison) {
  if (!comparison || Object.keys(comparison).length === 0) {
    return '<div class="section"><div class="section-header">⚖️ Detailed Comparison</div><div class="section-content">No comparison data available.</div></div>';
  }

  let content = "";

  for (const [route, comp] of Object.entries(comparison)) {
    content += `
      <h4 style="margin-bottom: 20px; color: #2d3748; font-size: 1.2em;">📍 ${route.toUpperCase()} Route</h4>
      <div class="comparison-grid">`;

    const metrics = [
      {
        key: "performanceScore",
        name: "Performance Score",
        unit: "/100",
        reverse: false,
      },
      { key: "fcp", name: "First Contentful Paint", unit: "ms", reverse: true },
      {
        key: "lcp",
        name: "Largest Contentful Paint",
        unit: "ms",
        reverse: true,
      },
      { key: "cls", name: "Cumulative Layout Shift", unit: "", reverse: true },
      { key: "tbt", name: "Total Blocking Time", unit: "ms", reverse: true },
      { key: "tti", name: "Time to Interactive", unit: "ms", reverse: true },
    ];

    for (const metric of metrics) {
      const improvement = comp.improvements[metric.key];
      if (improvement !== null && improvement !== undefined) {
        const reactValue =
          metric.key === "performanceScore"
            ? comp.reactRouter.lighthouse?.performanceScore?.mean
            : comp.reactRouter.lighthouse?.metrics?.[metric.key]?.mean;
        const tanstackValue =
          metric.key === "performanceScore"
            ? comp.tanstackRouter.lighthouse?.performanceScore?.mean
            : comp.tanstackRouter.lighthouse?.metrics?.[metric.key]?.mean;

        const improvementClass =
          improvement > 0 ? "improvement-positive" : "improvement-negative";
        const improvementText =
          improvement > 0
            ? `+${improvement.toFixed(1)}%`
            : `${improvement.toFixed(1)}%`;

        content += `
          <div class="metric-card">
              <div class="metric-title">${metric.name}</div>
              <div class="metric-value">
                  React Router: ${formatValue(reactValue, metric.unit)}
              </div>
              <div class="metric-value">
                  TanStack: ${formatValue(tanstackValue, metric.unit)}
              </div>
              <div class="metric-improvement ${improvementClass}">
                  ${
                    metric.reverse && improvement < 0
                      ? "Better"
                      : metric.reverse && improvement > 0
                      ? "Worse"
                      : ""
                  } ${improvementText}
              </div>
          </div>`;
      }
    }

    content += "</div>";
  }

  return `
    <div class="section">
        <div class="section-header">⚖️ Detailed Comparison</div>
        <div class="section-content">
            ${content}
        </div>
    </div>`;
}

// Generate detailed results section
function generateDetailedResultsSection(analysis) {
  if (!analysis || Object.keys(analysis).length === 0) {
    return '<div class="section"><div class="section-header">📋 Detailed Results</div><div class="section-content">No analysis data available.</div></div>';
  }

  let content = '<div class="tabs">';
  const apps = [...new Set(Object.values(analysis).map((a) => a.app))];

  apps.forEach((app, index) => {
    content += `<button class="tab ${
      index === 0 ? "active" : ""
    }" onclick="showTab('${app}')">${app.toUpperCase()}</button>`;
  });

  content += "</div>";

  apps.forEach((app, index) => {
    content += `<div class="tab-content ${
      index === 0 ? "active" : ""
    }" id="${app}">`;

    Object.values(analysis)
      .filter((a) => a.app === app)
      .forEach((result) => {
        content += `
        <h4 style="margin: 20px 0; color: #2d3748;">${result.route.toUpperCase()} Route (${
          result.runs
        } runs)</h4>
        <div class="comparison-grid">`;

        // Performance Score
        if (result.lighthouse?.performanceScore) {
          const score = result.lighthouse.performanceScore;
          content += `
          <div class="metric-card">
              <div class="metric-title">Performance Score</div>
              <div class="metric-value">${
                score.mean?.toFixed(1) || "N/A"
              }/100</div>
              <div>Range: ${score.min?.toFixed(1) || "N/A"} - ${
            score.max?.toFixed(1) || "N/A"
          }</div>
          </div>`;
        }

        // Core Web Vitals
        const vitals = [
          { key: "fcp", name: "First Contentful Paint", unit: "ms" },
          { key: "lcp", name: "Largest Contentful Paint", unit: "ms" },
          { key: "cls", name: "Cumulative Layout Shift", unit: "" },
          { key: "tbt", name: "Total Blocking Time", unit: "ms" },
        ];

        vitals.forEach((vital) => {
          const data = result.lighthouse?.metrics?.[vital.key];
          if (data && data.mean !== null && data.mean !== undefined) {
            const grade = getPerformanceGrade(data.mean, vital.key);
            content += `
            <div class="metric-card">
                <div class="metric-title">${vital.name}</div>
                <div class="metric-value">${formatValue(
                  data.mean,
                  vital.unit
                )}</div>
                <div class="${grade.className}">${grade.text}</div>
            </div>`;
          }
        });

        content += "</div>";
      });

    content += "</div>";
  });

  return `
    <div class="section">
        <div class="section-header">📋 Detailed Results</div>
        <div class="section-content">
            ${content}
        </div>
    </div>`;
}

// Generate charts section
function generateChartsSection(results, comparison) {
  return `
    <div class="section">
        <div class="section-header">📊 Performance Charts</div>
        <div class="section-content">
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="webVitalsChart"></canvas>
            </div>
        </div>
    </div>`;
}

// Generate raw data section
function generateRawDataSection(data) {
  return `
    <div class="section">
        <div class="section-header">🔍 Raw Data</div>
        <div class="section-content">
            <details>
                <summary style="cursor: pointer; padding: 10px; background: #f1f5f9; border-radius: 6px; margin-bottom: 15px;">
                    Click to view raw benchmark data
                </summary>
                <div class="raw-data">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            </details>
        </div>
    </div>`;
}

// Generate JavaScript for interactivity
function generateJavaScript(results, comparison) {
  return `
    function showTab(tabName) {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(\`button[onclick="showTab('\${tabName}')"]\`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    // Initialize charts when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeCharts();
    });

    function initializeCharts() {
        const results = ${JSON.stringify(results)};
        const comparison = ${JSON.stringify(comparison)};
        
        // Performance Score Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        createPerformanceChart(performanceCtx, results);
        
        // Web Vitals Chart
        const webVitalsCtx = document.getElementById('webVitalsChart').getContext('2d');
        createWebVitalsChart(webVitalsCtx, results);
    }

    function createPerformanceChart(ctx, results) {
        const groupedData = groupResultsByApp(results);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(groupedData),
                datasets: [{
                    label: 'Performance Score',
                    data: Object.values(groupedData).map(group => {
                        const scores = group.map(r => r.lighthouse?.performance).filter(s => s);
                        return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
                    }),
                    backgroundColor: ['#667eea', '#764ba2'],
                    borderColor: ['#5a67d8', '#6b46c1'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Performance Scores'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    function createWebVitalsChart(ctx, results) {
        const groupedData = groupResultsByApp(results);
        const metrics = ['fcp', 'lcp', 'tbt'];
        
        const datasets = Object.keys(groupedData).map((app, index) => ({
            label: app,
            data: metrics.map(metric => {
                const values = groupedData[app]
                    .map(r => r.lighthouse?.metrics?.[metric])
                    .filter(v => v !== null && v !== undefined);
                return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
            }),
            backgroundColor: index === 0 ? '#667eea' : '#764ba2',
            borderColor: index === 0 ? '#5a67d8' : '#6b46c1',
            borderWidth: 1
        }));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['First Contentful Paint (ms)', 'Largest Contentful Paint (ms)', 'Total Blocking Time (ms)'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Core Web Vitals Comparison'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function groupResultsByApp(results) {
        const grouped = {};
        results.forEach(result => {
            if (!grouped[result.app]) {
                grouped[result.app] = [];
            }
            grouped[result.app].push(result);
        });
        return grouped;
    }
  `;
}

// Helper functions
function formatValue(value, unit) {
  if (value === null || value === undefined || isNaN(value)) return "N/A";

  if (unit === "") {
    return value.toFixed(3);
  } else if (unit === "ms") {
    return Math.round(value) + unit;
  } else {
    return value.toFixed(1) + unit;
  }
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
  if (!threshold || value === null || value === undefined) {
    return { text: "Unknown", className: "" };
  }

  if (metric === "cls") {
    if (value <= threshold.good)
      return { text: "Good", className: "grade-good" };
    if (value <= threshold.poor)
      return {
        text: "Needs Improvement",
        className: "grade-needs-improvement",
      };
    return { text: "Poor", className: "grade-poor" };
  } else {
    if (value <= threshold.good)
      return { text: "Good", className: "grade-good" };
    if (value <= threshold.poor)
      return {
        text: "Needs Improvement",
        className: "grade-needs-improvement",
      };
    return { text: "Poor", className: "grade-poor" };
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

// Calculate statistics
function calculateStats(values) {
  if (!values || values.length === 0) return null;

  const validValues = values.filter(
    (v) => v !== null && v !== undefined && !isNaN(v)
  );
  if (validValues.length === 0) return null;

  const sorted = [...validValues].sort((a, b) => a - b);
  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;

  return {
    count: validValues.length,
    min: Math.min(...validValues),
    max: Math.max(...validValues),
    mean: mean,
    median: sorted[Math.floor(sorted.length / 2)],
  };
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

    analysis[key] = {
      ...group,
      runs: runs.length,
      lighthouse: {
        performanceScore: calculateStats(performanceScores),
        metrics: lighthouseMetrics,
      },
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

    // Calculate improvements
    const metrics = ["fcp", "lcp", "cls", "tbt", "tti", "si"];

    for (const metric of metrics) {
      const reactValue = reactRouter.lighthouse?.metrics?.[metric]?.mean;
      const tanstackValue = tanstackRouter.lighthouse?.metrics?.[metric]?.mean;

      if (reactValue && tanstackValue) {
        comparison[route].improvements[metric] =
          ((tanstackValue - reactValue) / reactValue) * 100;
      }
    }

    // Performance score improvement
    const reactScore = reactRouter.lighthouse?.performanceScore?.mean;
    const tanstackScore = tanstackRouter.lighthouse?.performanceScore?.mean;

    if (reactScore && tanstackScore) {
      comparison[route].improvements.performanceScore =
        ((tanstackScore - reactScore) / reactScore) * 100;
    }
  }

  return comparison;
}

// Main report generation function
async function generateReport(filePath, outputPath) {
  try {
    log.info(`Loading results from: ${filePath}`);
    const data = await loadResults(filePath);

    if (!data.results || data.results.length === 0) {
      throw new Error("No results found in the file");
    }

    // Process data
    const grouped = groupResults(data.results);
    const analysis = analyzeGroupedResults(grouped);
    const comparison = generateComparison(analysis);

    // Generate HTML report
    const html = generateHTMLReport(data, analysis, comparison);

    // Write report file
    await fs.writeFile(outputPath, html);

    log.success(`HTML report generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    log.error(`Report generation failed: ${error.message}`);
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
    .option("output", {
      type: "string",
      description: "Output path for HTML report",
      default: "./reports/report.html",
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

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(argv.output));

    await generateReport(filePath, argv.output);

    log.header("Report Generated Successfully!");
    log.info(`Open ${argv.output} in your browser to view the results`);
  } catch (error) {
    log.error(`Report generation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateReport };
