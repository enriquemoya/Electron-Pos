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

execSync("npm run build -w apps/online-store", { stdio: "inherit" });

const archive = join(distDir, "online-store.zip");

const files = [".next", "package.json", "public"];
if (existsSync(join(appDir, "next.config.js"))) {
  files.push("next.config.js");
}

execSync(`zip -r "${archive}" ${files.join(" ")}`, {
  stdio: "inherit",
  cwd: appDir
});

console.log(`online-store bundle created at ${archive}`);
