/**
 * Shared Configuration for Performance Testing
 * This file contains all configuration settings used by both
 * performance-benchmark.js and performance-full.js
 */

// Performance testing configuration
export const CONFIG = {
  // Routes to test
  routes: [
    {
      name: "posts",
      path: "/posts",
      description: "Posts list page",
    },
  ],

  // Applications to test
  apps: [
    {
      name: "react-router",
      url: "http://localhost:5173",
      port: 5173,
      buildCommand: "npm run build",
      startCommand: "npm run serve:prod",
      directory: "./react-router",
      healthUrl: "http://localhost:5173",
    },
    {
      name: "tanstack-router",
      url: "http://localhost:5174",
      port: 5174,
      buildCommand: "npm run build",
      startCommand: "npm run serve:prod",
      directory: "./tanstack-router",
      healthUrl: "http://localhost:5174",
    },
    {
      name: "next",
      url: "http://localhost:5175",
      port: 5175,
      buildCommand: "npm run build",
      startCommand: "npm run start:prod",
      directory: "./next",
      healthUrl: "http://localhost:5175",
    },
  ],

  // Testing parameters
  warmupRuns: 2,
  runs: 5,
  waitTime: 3000, // Wait time between measurements (ms)

  // Server management
  waitForServer: 10000, // Time to wait for server startup (ms)
  maxHealthChecks: 30, // Maximum health check attempts

  // Output configuration
  outputDir: "./reports",
};

// Utility function to get app configuration by name
export function getAppConfig(appName) {
  return CONFIG.apps.find((app) => app.name === appName);
}

// Utility function to get all app names
export function getAppNames() {
  return CONFIG.apps.map((app) => app.name);
}

// Utility function to get all ports
export function getAllPorts() {
  return CONFIG.apps.map((app) => app.port);
}

// Utility function to validate configuration
export function validateConfig() {
  const errors = [];

  // Check required fields
  if (!CONFIG.apps || CONFIG.apps.length === 0) {
    errors.push("No applications configured");
  }

  if (!CONFIG.routes || CONFIG.routes.length === 0) {
    errors.push("No routes configured");
  }

  // Check for duplicate ports
  const ports = CONFIG.apps.map((app) => app.port);
  const duplicatePorts = ports.filter(
    (port, index) => ports.indexOf(port) !== index
  );
  if (duplicatePorts.length > 0) {
    errors.push(`Duplicate ports found: ${duplicatePorts.join(", ")}`);
  }

  // Check for duplicate app names
  const names = CONFIG.apps.map((app) => app.name);
  const duplicateNames = names.filter(
    (name, index) => names.indexOf(name) !== index
  );
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate app names found: ${duplicateNames.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default CONFIG;
