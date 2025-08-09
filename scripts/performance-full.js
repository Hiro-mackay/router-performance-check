#!/usr/bin/env node

/**
 * Full Performance Testing Suite
 * Handles production builds, server management, measurement, and reporting
 */

import { spawn, exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { runBenchmark } from "./performance-benchmark.js";
import { getConfig, getAllPorts } from "./config.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const execAsync = promisify(exec);

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
    const ports = getAllPorts("local");
    const killCommands = ports.map(
      (port) => `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`
    );

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

async function startServer(config) {
  log.info(`Starting servers...`);

  return new Promise(async (resolve, reject) => {
    const serverProcess = spawn("sh", ["-c", `pnpm run preview`], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

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
      log.error(`Failed to start server: ${error.message}`);
      reject(error);
    });

    await Promise.all(
      config.apps.map(async (app) => {
        try {
          log.info(`Waiting for ${app.name} to start...`);
          const isHealthy = await checkServerHealth(
            app.url,
            config.waitForServer,
            config.maxHealthChecks
          );
          if (isHealthy) {
            log.success(`${app.name} server started successfully`);
          } else {
            log.error(`${app.name} server failed health check`);
            log.error(`Output: ${output}`);
            log.error(`Error: ${errorOutput}`);
            reject(new Error(`${app.name} server not responding`));
          }
        } catch (error) {
          log.error(`${app.name} health check failed: ${error.message}`);
          reject(error);
        }
      })
    ).catch((error) => {
      log.error(`Failed to start server: ${error.message}`);
      reject(error);
    });

    resolve(serverProcess);
  });
}

async function checkServerHealth(url, waitTime, maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await sleep(waitTime);
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

  // Additional cleanup to ensure no hanging processes
  try {
    const ports = getAllPorts("local");
    for (const port of ports) {
      await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
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
  const CONFIG = getConfig("local");

  log.header("🚀 Full Performance Testing Suite");
  log.info(
    `This will build, test, and analyze ${CONFIG.apps
      .map((app) => app.name)
      .join(", ")}`
  );

  try {
    // Clean up any existing servers
    await killExistingServers();

    // Start servers
    log.header("Starting Production Servers");
    await startServer(CONFIG);

    // Wait a bit more to ensure servers are fully ready
    await sleep(3000);

    // Run performance benchmark
    log.header("Running Performance Benchmark");
    const resultsFile = await runBenchmark({
      config: CONFIG,
    });
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

  // Ensure process exits after completion
  process.exit(0);
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

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  await stopServers();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  await stopServers();
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runFullPerformanceTest };
