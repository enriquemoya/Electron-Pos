#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { mkdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const root = process.cwd();
const appDir = join(root, "apps", "cloud-api");
const distDir = join(root, "dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

execSync("npm run prisma:generate -w apps/cloud-api", { stdio: "inherit" });
execSync("npm run build -w apps/cloud-api", { stdio: "inherit" });

const archive = join(distDir, "cloud-api.zip");

execSync(`zip -r "${archive}" dist package.json prisma`, {
  stdio: "inherit",
  cwd: appDir
});

console.log(`cloud-api bundle created at ${archive}`);
