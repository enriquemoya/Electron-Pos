#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { mkdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const root = process.cwd();
const appDir = join(root, "apps", "online-store");
const distDir = join(root, "dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const archive = join(distDir, "online-store-source.zip");
const sharedTsconfig = join(root, "tsconfig.base.json");
const appTsconfig = join(appDir, "tsconfig.base.json");
let copiedSharedTsconfig = false;

try {
  if (existsSync(sharedTsconfig) && !existsSync(appTsconfig)) {
    execSync(`cp "${sharedTsconfig}" "${appTsconfig}"`);
    copiedSharedTsconfig = true;
  }
} catch (error) {
  console.error("Failed to stage tsconfig.base.json for online-store bundle.");
  throw error;
}

const include = [
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "postcss.config.js",
  "tailwind.config.js",
  "tsconfig.json",
  "tsconfig.base.json",
  "i18n.ts",
  "messages",
  "src",
  "public",
];

const existing = include.filter((item) => {
  try {
    return existsSync(join(appDir, item));
  } catch {
    return false;
  }
});

execSync(`zip -r "${archive}" ${existing.join(" ")} -x "node_modules/*" -x ".next/*"`, {
  stdio: "inherit",
  cwd: appDir
});

if (copiedSharedTsconfig) {
  execSync(`rm "${appTsconfig}"`);
}

console.log(`online-store source bundle created at ${archive}`);
