#!/usr/bin/env node

/**
 * Full Performance Testing Suite
 * Handles production builds, server management, measurement, and reporting
 */

import { spawn, exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { runBenchmark } from "./performance-benchmark.js";

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  reactRouter: {
    name: "react-router",
    port: 5173,
    buildCommand: "npm run build",
    startCommand: "npm run serve:prod",
    directory: "./react-router",
    healthUrl: "http://localhost:5173",
  },
  tanstackRouter: {
    name: "tanstack-router",
    port: 5174,
    buildCommand: "npm run build",
    startCommand: "npm run serve:prod",
    directory: "./tanstack-router",
    healthUrl: "http://localhost:5174",
  },
  waitForServer: 10000, // 10 seconds
  maxHealthChecks: 30,
};

// Utility functions
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
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Server management
let serverProcesses = [];

async function killExistingServers() {
  log.info("Checking for existing servers...");

  try {
    // Kill any existing servers on our ports
    const killCommands = [
      `lsof -ti:${CONFIG.reactRouter.port} | xargs kill -9 2>/dev/null || true`,
      `lsof -ti:${CONFIG.tanstackRouter.port} | xargs kill -9 2>/dev/null || true`,
    ];

    for (const cmd of killCommands) {
      try {
        await execAsync(cmd);
      } catch (error) {
        // Ignore errors if no processes found
      }
    }

    log.success("Cleared existing servers");
  } catch (error) {
    log.warn("Could not clear existing servers, continuing...");
  }
}

async function buildApps() {
  log.header("Building Applications for Production");

  // Build React Router
  log.info("Building React Router...");
  try {
    await execAsync(
      `cd ${CONFIG.reactRouter.directory} && ${CONFIG.reactRouter.buildCommand}`
    );
    log.success("React Router build completed");
  } catch (error) {
    log.error(`React Router build failed: ${error.message}`);
    throw error;
  }

  // Build TanStack Router
  log.info("Building TanStack Router...");
  try {
    await execAsync(
      `cd ${CONFIG.tanstackRouter.directory} && ${CONFIG.tanstackRouter.buildCommand}`
    );
    log.success("TanStack Router build completed");
  } catch (error) {
    log.error(`TanStack Router build failed: ${error.message}`);
    throw error;
  }
}

async function startServer(config) {
  log.info(`Starting ${config.name} server on port ${config.port}...`);

  return new Promise((resolve, reject) => {
    const serverProcess = spawn(
      "sh",
      ["-c", `cd ${config.directory} && ${config.startCommand}`],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          PORT: config.port.toString(),
          HOST: "0.0.0.0",
          NODE_ENV: "production",
        },
      }
    );

    serverProcesses.push(serverProcess);

    let output = "";
    let errorOutput = "";

    serverProcess.stdout?.on("data", (data) => {
      output += data.toString();
    });

    serverProcess.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    serverProcess.on("error", (error) => {
      log.error(`Failed to start ${config.name}: ${error.message}`);
      reject(error);
    });

    // Give server time to start
    setTimeout(async () => {
      try {
        const isHealthy = await checkServerHealth(config.healthUrl);
        if (isHealthy) {
          log.success(`${config.name} server started successfully`);
          resolve(serverProcess);
        } else {
          log.error(`${config.name} server failed health check`);
          log.error(`Output: ${output}`);
          log.error(`Error: ${errorOutput}`);
          reject(new Error(`${config.name} server not responding`));
        }
      } catch (error) {
        log.error(`${config.name} health check failed: ${error.message}`);
        reject(error);
      }
    }, CONFIG.waitForServer);
  });
}

async function checkServerHealth(url, maxRetries = CONFIG.maxHealthChecks) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await sleep(1000);
  }
  return false;
}

async function stopServers() {
  log.info("Stopping servers...");

  for (const process of serverProcesses) {
    try {
      process.kill("SIGTERM");

      // Wait a bit for graceful shutdown
      await sleep(2000);

      if (!process.killed) {
        process.kill("SIGKILL");
      }
    } catch (error) {
      log.warn(`Error stopping server: ${error.message}`);
    }
  }

  // Force kill any remaining processes
  await killExistingServers();

  serverProcesses = [];
  log.success("All servers stopped");
}

async function runAnalysisAndReporting() {
  log.header("Generating Analysis and Reports");

  try {
    log.info("Running performance analysis...");
    const analysisResult = await execAsync("node scripts/analyze-results.js");
    log.success("Performance analysis completed");
    log.info(`Analysis output: ${analysisResult.stdout}`);

    log.info("Generating performance report...");
    const reportResult = await execAsync("node scripts/generate-report.js");
    log.success("Performance report generated");
    log.info(`Report output: ${reportResult.stdout}`);
  } catch (error) {
    log.error(`Analysis/reporting failed: ${error.message}`);
    if (error.stdout) log.error(`stdout: ${error.stdout}`);
    if (error.stderr) log.error(`stderr: ${error.stderr}`);
    throw error;
  }
}

async function main() {
  log.header("🚀 Full Performance Testing Suite");
  log.info(
    "This will build, test, and analyze both React Router and TanStack Router"
  );

  try {
    // Clean up any existing servers
    await killExistingServers();

    // Build applications
    await buildApps();

    // Start servers
    log.header("Starting Production Servers");
    await Promise.all([
      startServer(CONFIG.reactRouter),
      startServer(CONFIG.tanstackRouter),
    ]);

    // Wait a bit more to ensure servers are fully ready
    await sleep(3000);

    // Run performance benchmark
    log.header("Running Performance Benchmark");
    const resultsFile = await runBenchmark();
    log.success(`Performance testing completed: ${resultsFile}`);

    // Generate analysis and reports
    await runAnalysisAndReporting();

    log.header("🎉 Performance Testing Complete!");
    log.success("Check the reports/ directory for detailed results");
    log.info("📊 Performance analysis: reports/benchmark-analysis.json");
    log.info("📈 HTML report: reports/report.html");
    log.info("📋 Raw data: reports/benchmark-results.json");
  } catch (error) {
    log.error(`Performance testing failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Always clean up servers
    await stopServers();
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  log.warn("\nReceived SIGINT, cleaning up...");
  await stopServers();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  log.warn("\nReceived SIGTERM, cleaning up...");
  await stopServers();
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runFullPerformanceTest };
