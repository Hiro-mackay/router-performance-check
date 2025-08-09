#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n📦 ${description}...`, colors.blue);
  try {
    execSync(command, { stdio: "inherit" });
    log(`✅ ${description} completed successfully`, colors.green);
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    process.exit(1);
  }
}

function main() {
  log("🚀 Setting up Router Performance Check environment\n", colors.bright);

  // Check if we're in the right directory
  const currentDir = process.cwd();
  const expectedFiles = [
    "react-router",
    "tanstack-router",
    "performance-test.js",
  ];

  for (const file of expectedFiles) {
    if (!fs.existsSync(path.join(currentDir, file))) {
      log(`❌ Required file/directory not found: ${file}`, colors.red);
      log(
        "Please run this script from the project root directory.",
        colors.yellow
      );
      process.exit(1);
    }
  }

  log("🔍 Project structure verified", colors.green);

  // Install dependencies for React Router
  runCommand(
    "cd react-router && pnpm install",
    "Installing React Router dependencies"
  );

  // Install dependencies for Tanstack Router
  runCommand(
    "cd tanstack-router && pnpm install",
    "Installing Tanstack Router dependencies"
  );

  // Generate types for React Router
  runCommand(
    "cd react-router && pnpm react-router typegen",
    "Generating React Router types"
  );

  // Generate route tree for Tanstack Router
  runCommand(
    "cd tanstack-router && pnpm run build > /dev/null 2>&1 || true",
    "Generating Tanstack Router route tree"
  );

  log("\n🎉 Setup completed successfully!", colors.bright);
  log("\n📋 Available commands:", colors.yellow);
  log("  pnpm run dev          - Start both development servers");
  log("  pnpm run build        - Build both projects");
  log("  npm run test:performance - Run performance comparison");
  log("\n🌐 Development servers will run on:");
  log("  React Router:    http://localhost:5173");
  log("  Tanstack Router: http://localhost:3000");
}

main();
