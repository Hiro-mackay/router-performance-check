#!/usr/bin/env node

/**
 * Configuration management for router performance tests
 * Handles environment-specific settings and URLs
 */

import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Default configuration with placeholder URLs
const DEFAULT_CONFIG = {
  cloudflare: {
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
        url: process.env.REACT_ROUTER_URL,
        description: "React Router on Cloudflare Workers",
      },
      {
        name: "tanstack-router",
        url: process.env.TANSTACK_ROUTER_URL,
        description: "TanStack Router on Cloudflare Workers",
      },
      {
        name: "next",
        url: process.env.NEXT_URL,
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
  },
  local: {
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
        url: process.env.LOCAL_REACT_ROUTER_URL,
        port: process.env.LOCAL_REACT_ROUTER_URL.split(":").at(-1),
        startCommand: "pnpm run preview:react-router",
        description: "React Router (Local)",
      },
      {
        name: "tanstack-router",
        url: process.env.LOCAL_TANSTACK_ROUTER_URL,
        port: process.env.LOCAL_TANSTACK_ROUTER_URL.split(":").at(-1),
        startCommand: "pnpm run preview:tanstack-router",
        description: "TanStack Router (Local)",
      },
      {
        name: "next",
        url: process.env.LOCAL_NEXT_URL,
        port: process.env.LOCAL_NEXT_URL.split(":").at(-1),
        startCommand: "pnpm run preview:next",
        description: "Next.js (Local)",
      },
    ],

    // Testing parameters
    warmupRuns: 2,
    runs: 5,
    waitTime: 3000, // Wait time between measurements (ms)
    parallel: true, // Enable parallel execution for faster testing

    // Server management
    waitForServer: 10000, // Time to wait for server startup (ms)
    maxHealthChecks: 10, // Maximum health check attempts

    // Output configuration
    outputDir: "./reports",
  },
};

// Load local configuration if it exists
function loadLocalConfig() {
  const configPath = path.join(process.cwd(), "scripts", "local-config.json");

  try {
    if (fs.existsSync(configPath)) {
      const localConfig = fs.readJsonSync(configPath);
      return { ...DEFAULT_CONFIG, ...localConfig };
    }
  } catch (error) {
    console.warn("Warning: Could not load local-config.json:", error.message);
  }

  return DEFAULT_CONFIG;
}

// Get configuration based on environment
function getConfig(environment) {
  if (!environment) {
    console.error("Config: Environment is not set");
    process.exit(1);
  }

  const config = loadLocalConfig();

  // Validate that URLs are set
  const apps = config[environment]?.apps || [];

  for (const app of apps) {
    if (!app.url) {
      console.error(`Config: ${app.name} URL is not set`);
      process.exit(1);
    }
  }

  return config[environment] || config.cloudflare;
}

// Utility function to get app configuration by name
export function getAppConfig(environment, appName) {
  return getConfig(environment).apps.find((app) => app.name === appName);
}

// Utility function to get all app names
export function getAppNames(environment) {
  return getConfig(environment).apps.map((app) => app.name);
}

// Utility function to get all ports
export function getAllPorts(environment) {
  return getConfig(environment).apps.map((app) => app.port);
}

// Create a template for local configuration
function createLocalConfigTemplate() {
  const templatePath = path.join(
    process.cwd(),
    "scripts",
    "local-config.template.json"
  );
  const template = {
    cloudflare: {
      apps: [
        {
          name: "react-router",
          url: "https://your-react-router.workers.dev",
          description: "React Router on Cloudflare Workers",
        },
        {
          name: "tanstack-router",
          url: "https://your-tanstack-router.workers.dev",
          description: "TanStack Router on Cloudflare Workers",
        },
        {
          name: "next",
          url: "https://your-next.workers.dev",
          description: "Next.js on Cloudflare Workers",
        },
      ],
    },
  };

  fs.writeJsonSync(templatePath, template, { spaces: 2 });
  console.log("Created local-config.template.json");
  console.log(
    "Copy this file to local-config.json and update with your actual URLs"
  );
}

// Export functions and default config
export { getConfig, createLocalConfigTemplate, DEFAULT_CONFIG };

// If called directly, create template
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === "init") {
    createLocalConfigTemplate();
  } else {
    console.log("Usage: node config.js init");
    console.log("This will create a local-config.template.json file");
  }
}
