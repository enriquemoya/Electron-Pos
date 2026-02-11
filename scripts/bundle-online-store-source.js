#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { mkdirSync, existsSync, readFileSync, writeFileSync } = require("node:fs");
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
const packageJsonPath = join(appDir, "package.json");
const inlineEnv =
  "NEXT_PUBLIC_API_URL=https://api.danimezone.com " +
  "NEXT_PUBLIC_CLOUD_SHARED_SECRET=d623459f8cb04d3e61b3d654f37975760ba5cc89361443a8d332eb8c178d5e03 " +
  "NEXT_PUBLIC_JWT_SECRET=620b510438dc8fabb48d9345d372ecc0519fc5c01d15a43ef033e7df19428245 " +
  "NEXT_TELEMETRY_DISABLED=1";
let copiedSharedTsconfig = false;
let patchedPackageJson = false;
let originalPackageJson = "";

try {
  if (existsSync(sharedTsconfig) && !existsSync(appTsconfig)) {
    execSync(`cp "${sharedTsconfig}" "${appTsconfig}"`);
    copiedSharedTsconfig = true;
  }
} catch (error) {
  console.error("Failed to stage tsconfig.base.json for online-store bundle.");
  throw error;
}

try {
  if (existsSync(packageJsonPath)) {
    originalPackageJson = readFileSync(packageJsonPath, "utf8");
    const pkg = JSON.parse(originalPackageJson);
    if (pkg?.scripts?.build && pkg?.scripts?.start) {
      pkg.scripts.build = `${inlineEnv} ${pkg.scripts.build}`;
      pkg.scripts.start = `${inlineEnv} ${pkg.scripts.start}`;
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
      patchedPackageJson = true;
    }
  }
} catch (error) {
  console.error("Failed to inline env vars into online-store package.json.");
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
if (patchedPackageJson) {
  writeFileSync(packageJsonPath, originalPackageJson);
}

console.log(`online-store source bundle created at ${archive}`);
