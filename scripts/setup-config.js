#!/usr/bin/env node

/**
 * Setup script for configuring Cloudflare Worker URLs
 * Helps users set up their environment without exposing personal URLs
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

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

async function setupConfiguration() {
  log.header("Cloudflare Worker URL Configuration Setup");

  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env");
  const localConfigPath = path.join(
    projectRoot,
    "scripts",
    "local-config.json"
  );

  console.log(
    "\nThis script will help you configure your Cloudflare Worker URLs securely."
  );
  console.log(
    "Your URLs will be stored locally and won't be committed to Git.\n"
  );

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    log.warn(".env file already exists. Do you want to overwrite it? (y/N)");
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("", (input) => {
        rl.close();
        resolve(input.toLowerCase());
      });
    });

    if (answer !== "y" && answer !== "yes") {
      log.info("Setup cancelled. Your existing .env file was preserved.");
      return;
    }
  }

  // Get URLs from user
  console.log("\nPlease enter your Cloudflare Worker URLs:");
  console.log("(Press Enter to skip if you don't have a URL yet)\n");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const getInput = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, (input) => {
        resolve(input.trim());
      });
    });
  };

  const reactRouterUrl = await getInput(
    "React Router URL (e.g., https://react-router.yourname.workers.dev): "
  );
  const tanstackRouterUrl = await getInput(
    "TanStack Router URL (e.g., https://tanstack-router.yourname.workers.dev): "
  );
  const nextUrl = await getInput(
    "Next.js URL (e.g., https://next.yourname.workers.dev): "
  );

  rl.close();

  // Create .env file
  const envContent = [
    "# Cloudflare Worker URLs",
    "# Copy this file to .env and update with your actual URLs",
    "# These URLs will be used by the performance testing scripts",
    "",
    "# React Router Cloudflare Worker URL",
    reactRouterUrl
      ? `REACT_ROUTER_URL=${reactRouterUrl}`
      : "# REACT_ROUTER_URL=https://your-react-router.workers.dev",
    "",
    "# TanStack Router Cloudflare Worker URL",
    tanstackRouterUrl
      ? `TANSTACK_ROUTER_URL=${tanstackRouterUrl}`
      : "# TANSTACK_ROUTER_URL=https://your-tanstack-router.workers.dev",
    "",
    "# Next.js Cloudflare Worker URL",
    nextUrl
      ? `NEXT_URL=${nextUrl}`
      : "# NEXT_URL=https://your-next.workers.dev",
    "",
    "# Local development URLs (optional)",
    "# LOCAL_REACT_ROUTER_URL=http://localhost:3000",
    "# LOCAL_TANSTACK_ROUTER_URL=http://localhost:3001",
    "# LOCAL_NEXT_URL=http://localhost:3002",
  ].join("\n");

  try {
    await fs.writeFile(envPath, envContent);
    log.success(`Created .env file at ${envPath}`);
  } catch (error) {
    log.error(`Failed to create .env file: ${error.message}`);
    return;
  }

  // Create local-config.json if URLs were provided
  if (reactRouterUrl || tanstackRouterUrl || nextUrl) {
    const localConfig = {
      cloudflare: {
        apps: [
          {
            name: "react-router",
            url: reactRouterUrl || "https://react-router.example.workers.dev",
            description: "React Router on Cloudflare Workers",
          },
          {
            name: "tanstack-router",
            url:
              tanstackRouterUrl ||
              "https://tanstack-router.example.workers.dev",
            description: "TanStack Router on Cloudflare Workers",
          },
          {
            name: "next",
            url: nextUrl || "https://next.example.workers.dev",
            description: "Next.js on Cloudflare Workers",
          },
        ],
      },
    };

    try {
      await fs.writeJson(localConfigPath, localConfig, { spaces: 2 });
      log.success(`Created local-config.json at ${localConfigPath}`);
    } catch (error) {
      log.error(`Failed to create local-config.json: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  log.success("Configuration setup completed!");
  console.log("\nNext steps:");
  console.log("1. Edit the .env file if you need to update any URLs");
  console.log(
    "2. Run the Cloudflare benchmark: node scripts/cloudflare-worker-benchmark.js"
  );
  console.log("3. Your URLs are now secure and won't be committed to Git");
  console.log("\nSecurity notes:");
  console.log("• .env and local-config.json files are excluded from Git");
  console.log("• Never commit your actual Cloudflare URLs to version control");
  console.log("• Share the .env.example file with others instead");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupConfiguration().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

export { setupConfiguration };
