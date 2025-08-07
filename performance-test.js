#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Router Performance Comparison Test\n");

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

function measureBuildTime(projectPath, projectName) {
  log(`\n📦 Building ${projectName}...`, colors.blue);
  const startTime = Date.now();

  try {
    execSync("npm run build:analyze", {
      cwd: projectPath,
      stdio: "pipe",
    });
    const endTime = Date.now();
    const buildTime = endTime - startTime;

    log(`✅ ${projectName} built successfully in ${buildTime}ms`, colors.green);
    return buildTime;
  } catch (error) {
    log(`❌ ${projectName} build failed`, colors.red);
    console.error(error.toString());
    return null;
  }
}

function getBundleSize(projectPath, projectName) {
  let distPath, statsPath, assetsPath;

  if (projectName === "React Router") {
    distPath = path.join(projectPath, "build", "client");
    assetsPath = path.join(distPath, "assets");
    statsPath = path.join(
      __dirname,
      "performance-results",
      "react-router-stats.html"
    );
  } else {
    distPath = path.join(projectPath, "dist");
    assetsPath = path.join(distPath, "assets");
    statsPath = path.join(
      __dirname,
      "performance-results",
      "tanstack-router-stats.html"
    );
  }

  if (!fs.existsSync(distPath)) {
    log(`❌ Dist directory not found for ${projectName}`, colors.red);
    return null;
  }

  function calculateSizeRecursive(dirPath) {
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    if (!fs.existsSync(dirPath)) {
      return { total: 0, js: 0, css: 0 };
    }

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        const subResult = calculateSizeRecursive(filePath);
        totalSize += subResult.total;
        jsSize += subResult.js;
        cssSize += subResult.css;
      } else if (stats.isFile()) {
        totalSize += stats.size;

        if (file.endsWith(".js")) {
          jsSize += stats.size;
        } else if (file.endsWith(".css")) {
          cssSize += stats.size;
        }
      }
    });

    return { total: totalSize, js: jsSize, css: cssSize };
  }

  const result = calculateSizeRecursive(distPath);

  return {
    total: result.total,
    js: result.js,
    css: result.css,
    statsAvailable: fs.existsSync(statsPath),
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function savePerformanceResults(data) {
  const resultsDir = path.join(__dirname, "performance-results");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Ensure performance-results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save latest results
  const latestResultsPath = path.join(resultsDir, "latest-results.json");
  fs.writeFileSync(latestResultsPath, JSON.stringify(data, null, 2));

  // Save timestamped results
  const timestampedResultsPath = path.join(
    resultsDir,
    `results-${timestamp}.json`
  );
  fs.writeFileSync(timestampedResultsPath, JSON.stringify(data, null, 2));

  log(`\n💾 Results saved to:`, colors.blue);
  log(`  Latest: ${latestResultsPath}`);
  log(`  Timestamped: ${timestampedResultsPath}`);
}

function runPerformanceTest() {
  const reactRouterPath = path.join(__dirname, "react-router");
  const tanstackRouterPath = path.join(__dirname, "tanstack-router");

  log("🏁 Starting Performance Comparison\n", colors.bright);

  const testStartTime = Date.now();

  // Build projects and measure build times
  const reactRouterBuildTime = measureBuildTime(
    reactRouterPath,
    "React Router"
  );
  const tanstackRouterBuildTime = measureBuildTime(
    tanstackRouterPath,
    "Tanstack Router"
  );

  // Get bundle sizes
  const reactRouterBundle = getBundleSize(reactRouterPath, "React Router");
  const tanstackRouterBundle = getBundleSize(
    tanstackRouterPath,
    "Tanstack Router"
  );

  // Display results
  log("\n📊 Performance Comparison Results", colors.bright);
  log("=".repeat(50), colors.cyan);

  // Build Times
  log("\n⏱️  Build Times:", colors.yellow);
  if (reactRouterBuildTime) {
    log(`  React Router: ${reactRouterBuildTime}ms`, colors.green);
  }
  if (tanstackRouterBuildTime) {
    log(`  Tanstack Router: ${tanstackRouterBuildTime}ms`, colors.green);
  }

  if (reactRouterBuildTime && tanstackRouterBuildTime) {
    const faster =
      reactRouterBuildTime < tanstackRouterBuildTime
        ? "React Router"
        : "Tanstack Router";
    const ratio =
      Math.max(reactRouterBuildTime, tanstackRouterBuildTime) /
      Math.min(reactRouterBuildTime, tanstackRouterBuildTime);
    log(`  🏆 ${faster} is ${ratio.toFixed(2)}x faster`, colors.magenta);
  }

  // Bundle Sizes
  log("\n📦 Bundle Sizes:", colors.yellow);

  if (reactRouterBundle) {
    log(`  React Router:`, colors.green);
    log(`    Total: ${formatBytes(reactRouterBundle.total)}`);
    log(`    JavaScript: ${formatBytes(reactRouterBundle.js)}`);
    log(`    CSS: ${formatBytes(reactRouterBundle.css)}`);
    log(
      `    Stats: ${
        reactRouterBundle.statsAvailable ? "✅ Available" : "❌ Not found"
      }`
    );
  }

  if (tanstackRouterBundle) {
    log(`  Tanstack Router:`, colors.green);
    log(`    Total: ${formatBytes(tanstackRouterBundle.total)}`);
    log(`    JavaScript: ${formatBytes(tanstackRouterBundle.js)}`);
    log(`    CSS: ${formatBytes(tanstackRouterBundle.css)}`);
    log(
      `    Stats: ${
        tanstackRouterBundle.statsAvailable ? "✅ Available" : "❌ Not found"
      }`
    );
  }

  if (reactRouterBundle && tanstackRouterBundle) {
    log("\n🔍 Bundle Size Comparison:", colors.yellow);

    const totalDiff = reactRouterBundle.total - tanstackRouterBundle.total;
    const jsDiff = reactRouterBundle.js - tanstackRouterBundle.js;

    log(
      `  Total difference: ${formatBytes(Math.abs(totalDiff))} ${
        totalDiff > 0 ? "(React Router larger)" : "(Tanstack Router larger)"
      }`
    );
    log(
      `  JS difference: ${formatBytes(Math.abs(jsDiff))} ${
        jsDiff > 0 ? "(React Router larger)" : "(Tanstack Router larger)"
      }`
    );
  }

  // Instructions
  log("\n📋 Next Steps:", colors.bright);
  log("1. Start the development servers:", colors.cyan);
  log("   - React Router: cd react-router && npm run dev");
  log("   - Tanstack Router: cd tanstack-router && npm run dev");
  log("\n2. Navigate to /posts on both apps to test data loading performance");
  log("\n3. Check browser DevTools for:");
  log("   - Network tab: API fetch timing");
  log("   - Performance tab: Page load metrics");
  log("   - Console: Data fetching logs");

  if (reactRouterBundle?.statsAvailable) {
    log(
      `\n4. View React Router bundle analysis: ./performance-results/react-router-stats.html`
    );
  }

  if (tanstackRouterBundle?.statsAvailable) {
    log(
      `\n5. View Tanstack Router bundle analysis: ./performance-results/tanstack-router-stats.html`
    );
  }

  // Save performance results to JSON
  const performanceData = {
    timestamp: new Date().toISOString(),
    testDuration: Date.now() - testStartTime,
    buildTimes: {
      reactRouter: reactRouterBuildTime,
      tanstackRouter: tanstackRouterBuildTime,
      winner:
        reactRouterBuildTime && tanstackRouterBuildTime
          ? reactRouterBuildTime < tanstackRouterBuildTime
            ? "React Router"
            : "Tanstack Router"
          : null,
      ratio:
        reactRouterBuildTime && tanstackRouterBuildTime
          ? Math.max(reactRouterBuildTime, tanstackRouterBuildTime) /
            Math.min(reactRouterBuildTime, tanstackRouterBuildTime)
          : null,
    },
    bundleSizes: {
      reactRouter: reactRouterBundle,
      tanstackRouter: tanstackRouterBundle,
      comparison:
        reactRouterBundle && tanstackRouterBundle
          ? {
              totalDifference:
                reactRouterBundle.total - tanstackRouterBundle.total,
              jsDifference: reactRouterBundle.js - tanstackRouterBundle.js,
              cssDifference: reactRouterBundle.css - tanstackRouterBundle.css,
            }
          : null,
    },
    statsFiles: {
      reactRouter: reactRouterBundle?.statsAvailable
        ? "./performance-results/react-router-stats.html"
        : null,
      tanstackRouter: tanstackRouterBundle?.statsAvailable
        ? "./performance-results/tanstack-router-stats.html"
        : null,
    },
  };

  savePerformanceResults(performanceData);

  log("\n🎯 Manual Performance Testing:", colors.bright);
  log("- Use browser DevTools Performance tab");
  log("- Test on different devices/network conditions");
  log("- Measure Core Web Vitals (LCP, FID, CLS)");
  log("- Compare initial page load vs navigation performance");
}

// Run the test
runPerformanceTest();
