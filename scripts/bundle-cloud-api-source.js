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

const archive = join(distDir, "cloud-api-source.zip");

execSync("node ./scripts/export-email-templates.js", { stdio: "inherit" });

const include = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "src",
  "prisma",
];

execSync(`zip -r "${archive}" ${include.join(" ")} -x "node_modules/*"`, {
  stdio: "inherit",
  cwd: appDir
});

console.log(`cloud-api source bundle created at ${archive}`);
