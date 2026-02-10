#!/usr/bin/env node
const { copyFileSync, mkdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const root = process.cwd();
const sourceDir = join(root, "packages", "email-templates");
const targetDir = join(root, "apps", "cloud-api", "src", "email-templates");

if (!existsSync(sourceDir)) {
  console.error("email-templates source package not found:", sourceDir);
  process.exit(1);
}

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

copyFileSync(join(sourceDir, "index.js"), join(targetDir, "templates.js"));
copyFileSync(join(sourceDir, "index.d.ts"), join(targetDir, "templates.d.ts"));

console.log("email templates exported to", targetDir);
